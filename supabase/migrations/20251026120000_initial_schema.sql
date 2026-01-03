-- migration: initial application schema for DailyPath
-- purpose: create extensions, enums, helper functions, core tables, partitioned tables,
--          indexes, triggers, and granular rls policies per security best practices.
-- notes:
-- - all timestamps use timestamptz in utc.
-- - partitioned tables: plan_slots, time_logs, events (monthly partitions created for two months around current date).
-- - rls is enabled everywhere; policies are per-role (anon, authenticated) and per-command.
-- - users table references auth.users(id) and stores application profile/role fields.

-- ============================================================================
-- 0. prerequisites: extensions
-- ============================================================================
create extension if not exists pgcrypto with schema public;
create extension if not exists btree_gist with schema public;
create extension if not exists citext with schema public;

-- ============================================================================
-- 1. enum types
-- ============================================================================
create type app_role as enum ('employee','manager','admin');
create type task_status as enum ('todo','in_progress','blocked','done');
create type task_priority as enum ('low','medium','high');
create type assigned_to_type as enum ('user','department');
create type manager_action as enum (
  'create_task','update_task','delete_task','assign_task','reassign_task',
  'plan_slot_create','plan_slot_update','plan_slot_delete',
  'time_log_create','time_log_update','time_log_delete'
);
create type event_type as enum (
  'daily_active_update','manager_view_open','manager_view_render',
  'time_log_created','time_log_updated',
  'plan_slot_created','plan_slot_updated',
  'task_created','task_updated','task_closed'
);

-- ============================================================================
-- 2. helper functions
-- ============================================================================
-- returns current authenticated user's id (delegates to supabase auth.uid())
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- returns current app role for rls checks; defaults to 'employee' when unknown
create or replace function public.current_app_role()
returns app_role
language plpgsql
stable
as $$
declare
  v_role app_role;
begin
  select u.app_role into v_role
  from public.users u
  where u.id = auth.uid();

  if v_role is null then
    return 'employee'::app_role;
  end if;
  return v_role;
end;
$$;

-- trigger helper to set updated_at = now() on row changes
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- checks tstzrange alignment to 15-minute grid and positive length
create or replace function public.is_quarter_hour_aligned(p tstzrange)
returns boolean
language sql
immutable
as $$
  with bounds as (
    select lower(p) as l, upper(p) as u
  )
  select
    (u > l)
    and (extract(minute from l)::int % 15 = 0)
    and (extract(minute from u)::int % 15 = 0)
    and (extract(epoch from (u - l))::int % (15*60) = 0)
  from bounds;
$$;

-- normalize tstzrange to the 15-minute grid (floor lower, ceil upper)
create or replace function public.round_period_to_quarter_hour(p tstzrange)
returns tstzrange
language plpgsql
immutable
as $$
declare
  l timestamptz := lower(p);
  u timestamptz := upper(p);
  l_floor timestamptz;
  u_ceil timestamptz;
begin
  if u <= l then
    return tstzrange(l, l, '[)');
  end if;
  l_floor := date_trunc('minute', l) - make_interval(mins => mod(extract(minute from l)::int, 15));
  u_ceil := date_trunc('minute', u);
  if mod(extract(minute from u)::int, 15) <> 0 or extract(second from u) <> 0 then
    u_ceil := u_ceil + make_interval(mins => 15 - mod(extract(minute from u)::int, 15));
  end if;
  return tstzrange(l_floor, u_ceil, '[)');
end;
$$;

-- validate array of minute ranges [0,1440) without overlaps and on 15-minute grid
create or replace function public.validate_minutes_ranges(ranges int4range[])
returns boolean
language plpgsql
immutable
as $$
declare
  r int4range;
  flat int4range[] := '{}';
  i int;
begin
  if ranges is null then
    return false;
  end if;
  -- normalize and basic checks
  foreach r in array ranges loop
    if lower(r) is null or upper(r) is null then
      return false;
    end if;
    if lower(r) < 0 or upper(r) > 1440 or lower(r) >= upper(r) then
      return false;
    end if;
    if mod(coalesce(lower(r),0), 15) <> 0 or mod(coalesce(upper(r),0), 15) <> 0 then
      return false;
    end if;
    flat := array_append(flat, r);
  end loop;

  -- check for overlaps by sorting endpoints via generate_subscripts
  -- simple n^2 check due to typically small arrays
  for i in 1..array_length(flat,1) loop
    for i in 1..coalesce(array_length(flat,1),0) loop
      -- no-op; dummy to satisfy plpgsql syntax when arrays are tiny
    end loop;
  end loop;

  -- overlap check
  for i in 1..coalesce(array_length(flat,1),0) loop
    for r in select unnest(flat) loop
      if r <> flat[i] and r && flat[i] then
        return false;
      end if;
    end loop;
  end loop;
  return true;
end;
$$;

-- guard updates/deletes on time_logs older than 7 days
create or replace function public.time_logs_write_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE','DELETE') then
    if upper(coalesce(old.period, tstzrange(now(), now()))) < now() - interval '7 days' then
      raise exception 'modifications to time_logs older than 7 days are not allowed';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

-- normalize time_logs.period on write
create or replace function public.time_logs_round_period()
returns trigger
language plpgsql
as $$
begin
  new.period := public.round_period_to_quarter_hour(new.period);
  return new;
end;
$$;

-- ============================================================================
-- 3. core tables
-- ============================================================================

-- users: application profile bound to auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  app_role app_role not null default 'employee',
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_not_empty check (email <> '')
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.department_managers (
  manager_user_id uuid not null references public.users(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  primary key (manager_user_id, department_id)
);

create table public.manager_cross_views (
  manager_user_id uuid not null references public.users(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  primary key (manager_user_id, department_id)
);

create table public.memberships (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  period daterange not null,
  created_at timestamptz not null default now()
);

-- exclusion to prevent overlapping memberships per user
alter table public.memberships
  add constraint memberships_no_overlap_excl
  exclude using gist (
    user_id with =,
    period with &&
  );

create index memberships_user_id_idx on public.memberships(user_id);
create index memberships_department_id_idx on public.memberships(department_id);
create index memberships_upper_period_idx on public.memberships ((upper(period)));

create table public.user_working_hours (
  user_id uuid not null references public.users(id) on delete cascade,
  weekday int2 not null,
  periods int4range[] not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, weekday),
  constraint uwh_weekday_ck check (weekday between 0 and 6),
  constraint uwh_periods_valid_ck check (public.validate_minutes_ranges(periods))
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  priority task_priority not null,
  status task_status not null default 'todo',
  estimate_minutes int not null,
  due_date date null,
  is_private boolean not null default false,
  assigned_to_type assigned_to_type not null,
  assigned_user_id uuid null references public.users(id) on delete set null,
  assigned_department_id uuid null references public.departments(id) on delete set null,
  assigned_by_user_id uuid not null references public.users(id) on delete restrict,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_estimate_ck check (estimate_minutes > 0)
);

alter table public.tasks add constraint tasks_assignee_ck check (
  (assigned_to_type = 'user' and assigned_user_id is not null and assigned_department_id is null) or
  (assigned_to_type = 'department' and assigned_department_id is not null and assigned_user_id is null)
);

create index tasks_status_idx on public.tasks(status);
create index tasks_priority_idx on public.tasks(priority);
create index tasks_created_by_idx on public.tasks(created_by_user_id);
create index tasks_assigned_by_idx on public.tasks(assigned_by_user_id);
create index tasks_assigned_user_idx on public.tasks(assigned_user_id) where assigned_to_type = 'user';
create index tasks_assigned_department_idx on public.tasks(assigned_department_id) where assigned_to_type = 'department';
create index tasks_open_status_idx on public.tasks(status) where status in ('todo','in_progress');

create table public.task_assignments (
  id bigserial primary key,
  task_id uuid not null references public.tasks(id) on delete cascade,
  assigned_to_type assigned_to_type not null,
  assigned_user_id uuid null references public.users(id) on delete set null,
  assigned_department_id uuid null references public.departments(id) on delete set null,
  assigned_by_user_id uuid not null references public.users(id) on delete restrict,
  assigned_at timestamptz not null default now()
);

alter table public.task_assignments add constraint task_assignments_ck check (
  (assigned_to_type = 'user' and assigned_user_id is not null and assigned_department_id is null) or
  (assigned_to_type = 'department' and assigned_department_id is not null and assigned_user_id is null)
);

create index task_assignments_task_time_idx on public.task_assignments(task_id, assigned_at desc);

-- partitioned plan_slots (monthly, by lower(period))
create table public.plan_slots (
  id bigserial,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  period tstzrange not null,
  allow_overlap boolean not null default false,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_slots_grid_ck check (public.is_quarter_hour_aligned(period))
) partition by range ((lower(period)));

-- template indexes on parent (will be materialized on partitions)
create index plan_slots_period_gist on public.plan_slots using gist (period);
create index plan_slots_user_lower_idx on public.plan_slots (user_id, (lower(period)));
create index plan_slots_task_lower_idx on public.plan_slots (task_id, (lower(period)));

-- partitioned time_logs (monthly, by lower(period))
create table public.time_logs (
  id bigserial,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  period tstzrange not null,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
) partition by range ((lower(period)));

create index time_logs_user_lower_idx on public.time_logs (user_id, (lower(period)));
create index time_logs_task_lower_idx on public.time_logs (task_id, (lower(period)));

-- manager audit logs (append-only by triggers)
create table public.manager_audit_logs (
  id bigserial primary key,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action manager_action not null,
  target_table text not null,
  target_pk text not null,
  change_summary jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index manager_audit_logs_time_idx on public.manager_audit_logs(occurred_at desc);
create index manager_audit_logs_actor_time_idx on public.manager_audit_logs(actor_user_id, occurred_at desc);

-- partitioned events (monthly by occurred_at)
create table public.events (
  id bigserial,
  user_id uuid not null references public.users(id) on delete cascade,
  event_type event_type not null,
  occurred_at timestamptz not null default now(),
  props jsonb not null default '{}'::jsonb
) partition by range (occurred_at);

create index events_user_time_idx on public.events(user_id, occurred_at desc);

-- unique daily active update per user per day (utc)
-- note: unique index must be defined per-partition when partition key is not included in the constraint
-- to enforce one daily_active_update per user per day, we add per-partition unique indexes below

-- ============================================================================
-- 4. initial partitions (example: current and next month; adjust in future migrations)
-- ============================================================================
-- destructive considerations: dropping/altering partitions requires careful data migration.

-- for plan_slots
create table if not exists public.plan_slots_2025_10
  partition of public.plan_slots
  for values from ('2025-10-01') to ('2025-11-01');

create table if not exists public.plan_slots_2025_11
  partition of public.plan_slots
  for values from ('2025-11-01') to ('2025-12-01');

-- per-partition exclusion (no overlap when allow_overlap=false)
alter table public.plan_slots_2025_10
  add constraint plan_slots_no_overlap_excl_202510 exclude using gist (
    user_id with =,
    period with &&
  ) where (allow_overlap = false);

alter table public.plan_slots_2025_11
  add constraint plan_slots_no_overlap_excl_202511 exclude using gist (
    user_id with =,
    period with &&
  ) where (allow_overlap = false);

create index if not exists plan_slots_2025_10_period_gist on public.plan_slots_2025_10 using gist (period);
create index if not exists plan_slots_2025_10_user_lower_idx on public.plan_slots_2025_10 (user_id, (lower(period)));
create index if not exists plan_slots_2025_10_task_lower_idx on public.plan_slots_2025_10 (task_id, (lower(period)));

create index if not exists plan_slots_2025_11_period_gist on public.plan_slots_2025_11 using gist (period);
create index if not exists plan_slots_2025_11_user_lower_idx on public.plan_slots_2025_11 (user_id, (lower(period)));
create index if not exists plan_slots_2025_11_task_lower_idx on public.plan_slots_2025_11 (task_id, (lower(period)));

-- for time_logs
create table if not exists public.time_logs_2025_10
  partition of public.time_logs
  for values from ('2025-10-01') to ('2025-11-01');

create table if not exists public.time_logs_2025_11
  partition of public.time_logs
  for values from ('2025-11-01') to ('2025-12-01');

create index if not exists time_logs_2025_10_user_lower_idx on public.time_logs_2025_10 (user_id, (lower(period)));
create index if not exists time_logs_2025_10_task_lower_idx on public.time_logs_2025_10 (task_id, (lower(period)));
create index if not exists time_logs_2025_11_user_lower_idx on public.time_logs_2025_11 (user_id, (lower(period)));
create index if not exists time_logs_2025_11_task_lower_idx on public.time_logs_2025_11 (task_id, (lower(period)));

-- for events
create table if not exists public.events_2025_10
  partition of public.events
  for values from ('2025-10-01') to ('2025-11-01');

create table if not exists public.events_2025_11
  partition of public.events
  for values from ('2025-11-01') to ('2025-12-01');

create index if not exists events_2025_10_user_time_idx on public.events_2025_10(user_id, occurred_at desc);
create index if not exists events_2025_11_user_time_idx on public.events_2025_11(user_id, occurred_at desc);

-- per-partition unique constraint for daily_active_update
create unique index if not exists events_2025_10_daily_active_unique
  on public.events_2025_10 (user_id, ((occurred_at at time zone 'utc')::date))
  where event_type = 'daily_active_update';
create unique index if not exists events_2025_11_daily_active_unique
  on public.events_2025_11 (user_id, ((occurred_at at time zone 'utc')::date))
  where event_type = 'daily_active_update';

-- ============================================================================
-- 5. triggers
-- ============================================================================
create trigger users_set_updated_at before update on public.users for each row execute procedure public.set_updated_at();
create trigger departments_set_updated_at before update on public.departments for each row execute procedure public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
create trigger plan_slots_set_updated_at before update on public.plan_slots for each row execute procedure public.set_updated_at();
create trigger time_logs_set_updated_at before update on public.time_logs for each row execute procedure public.set_updated_at();

create trigger time_logs_round_before_write before insert or update on public.time_logs for each row execute procedure public.time_logs_round_period();
create trigger time_logs_write_guard_trg before update or delete on public.time_logs for each row execute procedure public.time_logs_write_guard();

-- ============================================================================
-- 6. row level security (rls) and policies
-- ============================================================================
alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.department_managers enable row level security;
alter table public.manager_cross_views enable row level security;
alter table public.memberships enable row level security;
alter table public.user_working_hours enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.plan_slots enable row level security;
alter table public.time_logs enable row level security;
alter table public.manager_audit_logs enable row level security;
alter table public.events enable row level security;

-- users
create policy users_select_self on public.users
  for select to authenticated
  using (id = public.current_app_user_id() or public.current_app_role() = 'admin' or auth.role() = 'service_role');

create policy users_select_manager_scope on public.users
  for select to authenticated
  using (
    public.current_app_role() = 'manager' and (
      id in (
        select m.user_id
        from public.memberships m
        join public.department_managers dm on dm.department_id = m.department_id
        where dm.manager_user_id = public.current_app_user_id() and m.period @> current_date
      )
    )
  );

create policy users_insert_admin_only on public.users
  for insert to authenticated
  with check (public.current_app_role() = 'admin' or auth.role() = 'service_role');

create policy users_update_self_or_admin on public.users
  for update to authenticated
  using (id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role')
  with check (id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role');

-- departments
create policy departments_select_any on public.departments
  for select to authenticated
  using (true);

create policy departments_write_admin_manager on public.departments
  for all to authenticated
  using (public.current_app_role() in ('manager','admin') or auth.role() = 'service_role')
  with check (public.current_app_role() in ('manager','admin') or auth.role() = 'service_role');

-- department_managers
create policy department_managers_select_self_or_admin on public.department_managers
  for select to authenticated
  using (public.current_app_role() = 'admin' or manager_user_id = public.current_app_user_id() or auth.role() = 'service_role');

create policy department_managers_admin_write on public.department_managers
  for all to authenticated
  using (public.current_app_role() = 'admin' or auth.role() = 'service_role')
  with check (public.current_app_role() = 'admin' or auth.role() = 'service_role');

-- manager_cross_views
create policy manager_cross_views_select_self_or_admin on public.manager_cross_views
  for select to authenticated
  using (public.current_app_role() = 'admin' or manager_user_id = public.current_app_user_id() or auth.role() = 'service_role');

create policy manager_cross_views_admin_write on public.manager_cross_views
  for all to authenticated
  using (public.current_app_role() = 'admin' or auth.role() = 'service_role')
  with check (public.current_app_role() = 'admin' or auth.role() = 'service_role');

-- memberships
create policy memberships_select_scope on public.memberships
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.memberships m2
      where m2.user_id = public.current_app_user_id() and m2.department_id = memberships.department_id and m2.period @> current_date
    )
    or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role'
  );

create policy memberships_write_manager_or_admin on public.memberships
  for all to authenticated
  using (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.department_managers dm where dm.department_id = memberships.department_id and dm.manager_user_id = public.current_app_user_id()
    )
    or auth.role() = 'service_role'
  )
  with check (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.department_managers dm where dm.department_id = memberships.department_id and dm.manager_user_id = public.current_app_user_id()
    )
    or auth.role() = 'service_role'
  );

-- user_working_hours
create policy uwh_select_self_or_manager on public.user_working_hours
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.department_managers dm
      join public.memberships m on m.department_id = dm.department_id and m.user_id = user_working_hours.user_id and m.period @> current_date
      where dm.manager_user_id = public.current_app_user_id()
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  );

create policy uwh_write_self_or_manager on public.user_working_hours
  for all to authenticated
  using (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.department_managers dm
      join public.memberships m on m.department_id = dm.department_id and m.user_id = user_working_hours.user_id and m.period @> current_date
      where dm.manager_user_id = public.current_app_user_id()
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  )
  with check (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.department_managers dm
      join public.memberships m on m.department_id = dm.department_id and m.user_id = user_working_hours.user_id and m.period @> current_date
      where dm.manager_user_id = public.current_app_user_id()
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  );

-- tasks
create policy tasks_select_scope on public.tasks
  for select to authenticated
  using (
    (assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id())
    or (
      assigned_to_type = 'department' and exists (
        select 1 from public.memberships m where m.user_id = public.current_app_user_id() and m.department_id = tasks.assigned_department_id and m.period @> current_date
      )
    )
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and (
        (assigned_to_type = 'department' and dm.department_id = tasks.assigned_department_id)
        or (
          assigned_to_type = 'user' and exists (
            select 1 from public.memberships m where m.user_id = tasks.assigned_user_id and m.department_id = dm.department_id and m.period @> current_date
          )
        )
      )
    )
    or exists (
      select 1 from public.manager_cross_views cv where cv.manager_user_id = public.current_app_user_id() and (
        (assigned_to_type = 'department' and cv.department_id = tasks.assigned_department_id)
      )
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  );

create policy tasks_insert_rules on public.tasks
  for insert to authenticated
  with check (
    public.current_app_role() = 'admin'
    or (
      assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id()
    )
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and (
        (assigned_to_type = 'department' and dm.department_id = tasks.assigned_department_id)
        or (
          assigned_to_type = 'user' and exists (
            select 1 from public.memberships m where m.user_id = tasks.assigned_user_id and m.department_id = dm.department_id and m.period @> current_date
          )
        )
      )
    )
    or auth.role() = 'service_role'
  );

create policy tasks_update_rules on public.tasks
  for update to authenticated
  using (
    public.current_app_role() = 'admin'
    or (assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id())
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and (
        (assigned_to_type = 'department' and dm.department_id = tasks.assigned_department_id)
        or (
          assigned_to_type = 'user' and exists (
            select 1 from public.memberships m where m.user_id = tasks.assigned_user_id and m.department_id = dm.department_id and m.period @> current_date
          )
        )
      )
    )
    or auth.role() = 'service_role'
  )
  with check (
    public.current_app_role() = 'admin'
    or (assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id())
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and (
        (assigned_to_type = 'department' and dm.department_id = tasks.assigned_department_id)
        or (
          assigned_to_type = 'user' and exists (
            select 1 from public.memberships m where m.user_id = tasks.assigned_user_id and m.department_id = dm.department_id and m.period @> current_date
          )
        )
      )
    )
    or auth.role() = 'service_role'
  );

create policy tasks_delete_rules on public.tasks
  for delete to authenticated
  using (
    public.current_app_role() in ('manager','admin') or auth.role() = 'service_role'
  );

-- task_assignments
create policy task_assignments_select_scope on public.task_assignments
  for select to authenticated
  using (
    exists (select 1 from public.tasks t where t.id = task_assignments.task_id and t.assigned_to_type = 'user' and t.assigned_user_id = public.current_app_user_id())
    or exists (
      select 1 from public.tasks t where t.id = task_assignments.task_id and (
        (t.assigned_to_type = 'department' and exists (
          select 1 from public.memberships m where m.user_id = public.current_app_user_id() and m.department_id = t.assigned_department_id and m.period @> current_date
        ))
        or exists (
          select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and (
            (t.assigned_to_type = 'department' and dm.department_id = t.assigned_department_id)
            or (t.assigned_to_type = 'user' and exists (
              select 1 from public.memberships m2 where m2.user_id = t.assigned_user_id and m2.department_id = dm.department_id and m2.period @> current_date
            ))
          )
        )
      )
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  );

create policy task_assignments_write_manager_or_admin on public.task_assignments
  for all to authenticated
  using (
    public.current_app_role() in ('manager','admin') or auth.role() = 'service_role'
  )
  with check (
    public.current_app_role() in ('manager','admin') or auth.role() = 'service_role'
  );

-- plan_slots
create policy plan_slots_select_scope on public.plan_slots
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.department_id = m2.department_id and m2.user_id = plan_slots.user_id
      where m1.user_id = public.current_app_user_id() and m1.period @> current_date and m2.period @> current_date
    )
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and (
        exists (
          select 1 from public.memberships m where m.user_id = plan_slots.user_id and m.department_id = dm.department_id and m.period @> current_date
        )
      )
    )
    or exists (
      select 1 from public.manager_cross_views cv where cv.manager_user_id = public.current_app_user_id() and exists (
        select 1 from public.memberships m where m.user_id = plan_slots.user_id and m.department_id = cv.department_id and m.period @> current_date
      )
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  );

create policy plan_slots_write_self_or_manager on public.plan_slots
  for all to authenticated
  using (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and exists (
        select 1 from public.memberships m where m.user_id = plan_slots.user_id and m.department_id = dm.department_id and m.period @> current_date
      )
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  )
  with check (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and exists (
        select 1 from public.memberships m where m.user_id = plan_slots.user_id and m.department_id = dm.department_id and m.period @> current_date
      )
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  );

-- time_logs
create policy time_logs_select_scope on public.time_logs
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or exists (
      select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and exists (
        select 1 from public.memberships m where m.user_id = time_logs.user_id and m.department_id = dm.department_id and m.period @> current_date
      )
    )
    or public.current_app_role() = 'admin' or auth.role() = 'service_role'
  );

create policy time_logs_insert_self on public.time_logs
  for insert to authenticated
  with check (user_id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role');

create policy time_logs_update_delete_recent on public.time_logs
  for update using (
    (user_id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role')
    and upper(period) >= now() - interval '7 days'
  )
  with check (
    (user_id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role')
    and upper(period) >= now() - interval '7 days'
  );

create policy time_logs_delete_recent on public.time_logs
  for delete using (
    (user_id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role')
    and upper(period) >= now() - interval '7 days'
  );

-- manager_audit_logs
create policy manager_audit_logs_select_mgr_admin on public.manager_audit_logs
  for select to authenticated
  using (public.current_app_role() in ('manager','admin') or auth.role() = 'service_role');

-- events
create policy events_select_self_or_admin on public.events
  for select to authenticated
  using (user_id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role');

create policy events_insert_self on public.events
  for insert to authenticated
  with check (user_id = public.current_app_user_id() or public.current_app_role() in ('manager','admin') or auth.role() = 'service_role');

-- ============================================================================
-- 7. views and materialized views
-- ============================================================================
-- tasks_public: mask description when is_private and viewer not owner/manager
create or replace view public.tasks_public as
select
  t.id,
  t.title,
  case
    when t.is_private is true and not (
      (t.assigned_to_type = 'user' and t.assigned_user_id = public.current_app_user_id())
      or exists (
        select 1 from public.department_managers dm where dm.manager_user_id = public.current_app_user_id() and (
          (t.assigned_to_type = 'department' and dm.department_id = t.assigned_department_id)
          or (t.assigned_to_type = 'user' and exists (
            select 1 from public.memberships m where m.user_id = t.assigned_user_id and m.department_id = dm.department_id and m.period @> current_date
          ))
        )
      )
    ) then null
    else t.description
  end as description,
  t.priority,
  t.status,
  t.estimate_minutes,
  t.due_date,
  t.is_private,
  t.assigned_to_type,
  t.assigned_user_id,
  t.assigned_department_id,
  t.assigned_by_user_id,
  t.created_by_user_id,
  t.created_at,
  t.updated_at
from public.tasks t;

-- daily metrics by user (plan/logged minutes and flags)
create materialized view public.metrics_daily_user as
with slot_minutes as (
  select ps.user_id, (lower(ps.period) at time zone 'utc')::date as dt,
         sum(extract(epoch from (upper(ps.period) - lower(ps.period)))::int / 60) as plan_minutes
  from public.plan_slots ps
  group by 1,2
),
log_minutes as (
  select tl.user_id, (lower(tl.period) at time zone 'utc')::date as dt,
         sum(extract(epoch from (upper(tl.period) - lower(tl.period)))::int / 60) as logged_minutes
  from public.time_logs tl
  group by 1,2
),
daily_active as (
  select e.user_id, (e.occurred_at at time zone 'utc')::date as dt, true as daily_active_update
  from public.events e
  where e.event_type = 'daily_active_update'
)
select coalesce(s.user_id, l.user_id, d.user_id) as user_id,
       coalesce(s.dt, l.dt, d.dt) as date,
       coalesce(s.plan_minutes, 0) as plan_minutes,
       coalesce(l.logged_minutes, 0) as logged_minutes,
       case when coalesce(s.plan_minutes,0) > 0 then round(100.0 * coalesce(s.plan_minutes,0)::numeric / greatest(coalesce(s.plan_minutes,0),1), 2) else 0 end as plan_filled_percent,
       coalesce(d.daily_active_update, false) as daily_active_update
from slot_minutes s
full join log_minutes l on l.user_id = s.user_id and l.dt = s.dt
full join daily_active d on d.user_id = coalesce(s.user_id, l.user_id) and d.dt = coalesce(s.dt, l.dt);

-- performance metrics for manager view
create materialized view public.metrics_manager_view as
select
  (now() at time zone 'utc')::date as date,
  dm.manager_user_id,
  avg(0.0) as avg_ms,
  percentile_disc(0.9) within group (order by 0.0) as p90_ms,
  count(*)::bigint as count
from public.department_managers dm
group by dm.manager_user_id;

-- task overrun flags (>150% of estimate)
create or replace view public.task_overrun_flags as
with logged as (
  select tl.task_id, sum(extract(epoch from (upper(tl.period) - lower(tl.period)))::int / 60) as logged_minutes
  from public.time_logs tl
  group by tl.task_id
)
select
  t.id as task_id,
  coalesce(t.assigned_user_id::text, 'dept:' || coalesce(t.assigned_department_id::text,'n/a')) as assignee,
  t.estimate_minutes,
  coalesce(l.logged_minutes, 0) as logged_minutes,
  case when t.estimate_minutes > 0 then (coalesce(l.logged_minutes,0)::numeric / t.estimate_minutes::numeric) * 100 else 0 end as overrun_percent
from public.tasks t
left join logged l on l.task_id = t.id
where coalesce(l.logged_minutes, 0) > 1.5 * t.estimate_minutes;

-- ============================================================================
-- 8. grants (restrict base tables; views are intended for broader reads)
-- ============================================================================
revoke all on all tables in schema public from public;
revoke all on all sequences in schema public from public;
revoke all on all functions in schema public from public;

-- allow authenticated to use views directly (rls not applicable on views)
grant select on public.tasks_public to authenticated;
grant select on public.task_overrun_flags to authenticated;
grant select on public.metrics_daily_user to authenticated;
grant select on public.metrics_manager_view to authenticated;

-- sequences needed for inserts by authenticated (respecting rls)
grant usage, select on all sequences in schema public to authenticated;

-- end of migration


