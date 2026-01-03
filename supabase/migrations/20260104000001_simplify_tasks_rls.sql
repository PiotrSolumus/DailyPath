-- migration: simplify tasks RLS policies to avoid stack depth limit
-- purpose: fix 54001 error by reducing complexity of policies

-- Drop existing complex policies
drop policy if exists tasks_select_scope on public.tasks;
drop policy if exists tasks_insert_rules on public.tasks;
drop policy if exists tasks_update_rules on public.tasks;
drop policy if exists tasks_delete_rules on public.tasks;

-- Simplified SELECT policy
-- Users can see:
-- 1. Tasks assigned to them directly
-- 2. Admin can see everything
-- 3. Managers can see everything (simplified for now)
create policy tasks_select_scope on public.tasks
  for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or public.current_app_role() = 'manager'
    or assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id()
    or assigned_to_type = 'department' -- allow viewing department tasks
    or auth.role() = 'service_role'
  );

-- Simplified INSERT policy
-- Users can create tasks:
-- 1. Admin can create any task
-- 2. Managers can create any task
-- 3. Employees can create tasks assigned to themselves
create policy tasks_insert_rules on public.tasks
  for insert to authenticated
  with check (
    public.current_app_role() = 'admin'
    or public.current_app_role() = 'manager'
    or (assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id())
    or auth.role() = 'service_role'
  );

-- Simplified UPDATE policy
create policy tasks_update_rules on public.tasks
  for update to authenticated
  using (
    public.current_app_role() = 'admin'
    or public.current_app_role() = 'manager'
    or (assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id())
    or auth.role() = 'service_role'
  )
  with check (
    public.current_app_role() = 'admin'
    or public.current_app_role() = 'manager'
    or (assigned_to_type = 'user' and assigned_user_id = public.current_app_user_id())
    or auth.role() = 'service_role'
  );

-- Simplified DELETE policy
create policy tasks_delete_rules on public.tasks
  for delete to authenticated
  using (
    public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

