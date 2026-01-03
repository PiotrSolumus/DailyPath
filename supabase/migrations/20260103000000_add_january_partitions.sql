-- migration: add partitions for January 2026
-- purpose: fix 42P17 error by ensuring partitions exist for current data

-- ============================================================================
-- 1. Add January 2026 partitions
-- ============================================================================

-- for plan_slots
create table if not exists public.plan_slots_2026_01
  partition of public.plan_slots
  for values from ('2026-01-01') to ('2026-02-01');

-- per-partition exclusion (no overlap when allow_overlap=false)
alter table public.plan_slots_2026_01
  add constraint plan_slots_no_overlap_excl_202601 exclude using gist (
    user_id with =,
    period with &&
  ) where (allow_overlap = false);

create index if not exists plan_slots_2026_01_period_gist on public.plan_slots_2026_01 using gist (period);
create index if not exists plan_slots_2026_01_user_lower_idx on public.plan_slots_2026_01 (user_id, (lower(period)));
create index if not exists plan_slots_2026_01_task_lower_idx on public.plan_slots_2026_01 (task_id, (lower(period)));

-- for time_logs
create table if not exists public.time_logs_2026_01
  partition of public.time_logs
  for values from ('2026-01-01') to ('2026-02-01');

create index if not exists time_logs_2026_01_user_lower_idx on public.time_logs_2026_01 (user_id, (lower(period)));
create index if not exists time_logs_2026_01_task_lower_idx on public.time_logs_2026_01 (task_id, (lower(period)));

-- for events
create table if not exists public.events_2026_01
  partition of public.events
  for values from ('2026-01-01') to ('2026-02-01');

create index if not exists events_2026_01_user_time_idx on public.events_2026_01(user_id, occurred_at desc);

-- per-partition unique constraint for daily_active_update
create unique index if not exists events_2026_01_daily_active_unique
  on public.events_2026_01 (user_id, ((occurred_at at time zone 'utc')::date))
  where event_type = 'daily_active_update';

