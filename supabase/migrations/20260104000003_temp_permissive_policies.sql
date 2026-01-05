-- migration: temporary permissive policies for development
-- purpose: allow basic CRUD operations without complex RLS for now
-- TODO: In production, these should be tightened

-- For tasks - make it very simple
drop policy if exists tasks_select_scope on public.tasks;
drop policy if exists tasks_insert_rules on public.tasks;
drop policy if exists tasks_update_rules on public.tasks;
drop policy if exists tasks_delete_rules on public.tasks;

-- Simple policies: authenticated users can do anything
create policy tasks_all_authenticated on public.tasks
  for all to authenticated
  using (true)
  with check (true);



