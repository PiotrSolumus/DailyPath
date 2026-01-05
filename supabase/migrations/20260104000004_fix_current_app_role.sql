-- migration: fix current_app_role to avoid RLS recursion
-- purpose: make current_app_role bypass RLS to prevent stack depth issues

-- Recreate current_app_role with SECURITY DEFINER
-- This allows the function to bypass RLS when reading from users table
-- Using CREATE OR REPLACE to avoid dropping and recreating all dependent policies
create or replace function public.current_app_role()
returns app_role
language plpgsql
stable
security definer -- This is the key: bypass RLS when executing this function
set search_path = public
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

-- Grant execute permission to authenticated users
grant execute on function public.current_app_role() to authenticated;

