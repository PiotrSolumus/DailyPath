-- migration: fix infinite recursion in memberships RLS policy
-- purpose: remove recursive policy that causes 42P17 error

-- Drop existing problematic policy
drop policy if exists memberships_select_scope on public.memberships;

-- Create new simplified policy without recursion
-- Users can see:
-- 1. Their own memberships
-- 2. Managers and admins can see all memberships
-- Removed: "same department" check that caused recursion
create policy memberships_select_scope on public.memberships
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_app_role() in ('manager','admin')
    or auth.role() = 'service_role'
  );

