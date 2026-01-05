-- migration: simplify other RLS policies to avoid stack depth issues
-- purpose: reduce complexity in plan_slots, time_logs, and other policies

-- ============================================================================
-- plan_slots policies
-- ============================================================================
drop policy if exists plan_slots_select_scope on public.plan_slots;
drop policy if exists plan_slots_write_self_or_manager on public.plan_slots;

create policy plan_slots_select_scope on public.plan_slots
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

create policy plan_slots_write_self_or_manager on public.plan_slots
  for all to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  )
  with check (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

-- ============================================================================
-- time_logs policies
-- ============================================================================
drop policy if exists time_logs_select_scope on public.time_logs;

create policy time_logs_select_scope on public.time_logs
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

-- ============================================================================
-- user_working_hours policies
-- ============================================================================
drop policy if exists uwh_select_self_or_manager on public.user_working_hours;
drop policy if exists uwh_write_self_or_manager on public.user_working_hours;

create policy uwh_select_self_or_manager on public.user_working_hours
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

create policy uwh_write_self_or_manager on public.user_working_hours
  for all to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  )
  with check (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

-- ============================================================================
-- users policies
-- ============================================================================
drop policy if exists users_select_self on public.users;
drop policy if exists users_select_manager_scope on public.users;

-- Combine into single simpler policy
create policy users_select_all on public.users
  for select to authenticated
  using (
    id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

-- ============================================================================
-- task_assignments policies  
-- ============================================================================
drop policy if exists task_assignments_select_scope on public.task_assignments;

create policy task_assignments_select_scope on public.task_assignments
  for select to authenticated
  using (
    public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );



