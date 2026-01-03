-- Seed data for testing GET /api/tasks endpoint
-- This script creates test users, departments, tasks, and plan_slots

-- Note: In Supabase local dev, auth.users must be created via Auth API
-- This seed focuses on public schema tables that reference auth.users

-- ============================================================================
-- 1. Test Users (assuming they exist in auth.users)
-- ============================================================================
-- We'll use these UUIDs in our seed data:
-- Admin: 00000000-0000-0000-0000-000000000001
-- Manager1: 00000000-0000-0000-0000-000000000002
-- Manager2: 00000000-0000-0000-0000-000000000003
-- Employee1: 00000000-0000-0000-0000-000000000004
-- Employee2: 00000000-0000-0000-0000-000000000005
-- Employee3: 00000000-0000-0000-0000-000000000006

-- NOTE: Users must be created via scripts/create-test-users.js FIRST
-- That script creates users in both auth.users and public.users
-- This seed.sql file only creates departments, tasks, and other data that depends on users existing

-- Verify users exist (optional check)
-- If this fails, run: node scripts/create-test-users.js

-- ============================================================================
-- 2. Departments
-- ============================================================================
INSERT INTO public.departments (id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Engineering'),
  ('10000000-0000-0000-0000-000000000002', 'Product'),
  ('10000000-0000-0000-0000-000000000003', 'Marketing')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. Department Managers
-- ============================================================================
INSERT INTO public.department_managers (manager_user_id, department_id) VALUES
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'), -- Manager1 -> Engineering
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')  -- Manager2 -> Product
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Manager Cross Views (read-only access)
-- ============================================================================
INSERT INTO public.manager_cross_views (manager_user_id, department_id) VALUES
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002')  -- Manager1 can view Product dept
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. Memberships (current active memberships)
-- ============================================================================
INSERT INTO public.memberships (user_id, department_id, period) VALUES
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '[2026-01-01,2026-12-31)'), -- Employee1 -> Engineering
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '[2026-01-01,2026-12-31)'), -- Employee2 -> Engineering
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '[2026-01-01,2026-12-31)')  -- Employee3 -> Product
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. Tasks
-- ============================================================================
-- Task 1: Public task assigned to Employee1 (Engineering)
INSERT INTO public.tasks (
  id, title, description, priority, status, estimate_minutes, due_date,
  is_private, assigned_to_type, assigned_user_id, assigned_department_id,
  assigned_by_user_id, created_by_user_id
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Implement user authentication',
  'Set up Supabase auth with RLS policies',
  'high',
  'in_progress',
  240,
  '2026-01-10',
  false,
  'user',
  '00000000-0000-0000-0000-000000000004', -- Employee1
  NULL,
  '00000000-0000-0000-0000-000000000002', -- Manager1
  '00000000-0000-0000-0000-000000000002'  -- Manager1
) ON CONFLICT (id) DO NOTHING;

-- Task 2: Private task assigned to Employee1
INSERT INTO public.tasks (
  id, title, description, priority, status, estimate_minutes, due_date,
  is_private, assigned_to_type, assigned_user_id, assigned_department_id,
  assigned_by_user_id, created_by_user_id
) VALUES (
  '20000000-0000-0000-0000-000000000002',
  'Personal development task',
  'This is a private description that should be masked',
  'medium',
  'todo',
  120,
  NULL,
  true, -- PRIVATE
  'user',
  '00000000-0000-0000-0000-000000000004', -- Employee1
  NULL,
  '00000000-0000-0000-0000-000000000004', -- Employee1
  '00000000-0000-0000-0000-000000000004'  -- Employee1
) ON CONFLICT (id) DO NOTHING;

-- Task 3: Public task assigned to Engineering department
INSERT INTO public.tasks (
  id, title, description, priority, status, estimate_minutes, due_date,
  is_private, assigned_to_type, assigned_user_id, assigned_department_id,
  assigned_by_user_id, created_by_user_id
) VALUES (
  '20000000-0000-0000-0000-000000000003',
  'Refactor database schema',
  'Update migrations and add indexes',
  'high',
  'todo',
  480,
  '2026-01-15',
  false,
  'department',
  NULL,
  '10000000-0000-0000-0000-000000000001', -- Engineering
  '00000000-0000-0000-0000-000000000002', -- Manager1
  '00000000-0000-0000-0000-000000000002'  -- Manager1
) ON CONFLICT (id) DO NOTHING;

-- Task 4: Public task assigned to Employee2 (Engineering)
INSERT INTO public.tasks (
  id, title, description, priority, status, estimate_minutes, due_date,
  is_private, assigned_to_type, assigned_user_id, assigned_department_id,
  assigned_by_user_id, created_by_user_id
) VALUES (
  '20000000-0000-0000-0000-000000000004',
  'Write API documentation',
  'Document all endpoints with examples',
  'medium',
  'in_progress',
  180,
  '2026-01-08',
  false,
  'user',
  '00000000-0000-0000-0000-000000000005', -- Employee2
  NULL,
  '00000000-0000-0000-0000-000000000002', -- Manager1
  '00000000-0000-0000-0000-000000000002'  -- Manager1
) ON CONFLICT (id) DO NOTHING;

-- Task 5: Public task assigned to Employee3 (Product dept)
INSERT INTO public.tasks (
  id, title, description, priority, status, estimate_minutes, due_date,
  is_private, assigned_to_type, assigned_user_id, assigned_department_id,
  assigned_by_user_id, created_by_user_id
) VALUES (
  '20000000-0000-0000-0000-000000000005',
  'Design new feature mockups',
  'Create Figma designs for dashboard',
  'low',
  'todo',
  300,
  '2026-01-20',
  false,
  'user',
  '00000000-0000-0000-0000-000000000006', -- Employee3
  NULL,
  '00000000-0000-0000-0000-000000000003', -- Manager2
  '00000000-0000-0000-0000-000000000003'  -- Manager2
) ON CONFLICT (id) DO NOTHING;

-- Task 6: Blocked task
INSERT INTO public.tasks (
  id, title, description, priority, status, estimate_minutes, due_date,
  is_private, assigned_to_type, assigned_user_id, assigned_department_id,
  assigned_by_user_id, created_by_user_id
) VALUES (
  '20000000-0000-0000-0000-000000000006',
  'Deploy to production',
  'Waiting for QA approval',
  'high',
  'blocked',
  60,
  '2026-01-05',
  false,
  'user',
  '00000000-0000-0000-0000-000000000004', -- Employee1
  NULL,
  '00000000-0000-0000-0000-000000000002', -- Manager1
  '00000000-0000-0000-0000-000000000002'  -- Manager1
) ON CONFLICT (id) DO NOTHING;

-- Task 7: Done task
INSERT INTO public.tasks (
  id, title, description, priority, status, estimate_minutes, due_date,
  is_private, assigned_to_type, assigned_user_id, assigned_department_id,
  assigned_by_user_id, created_by_user_id
) VALUES (
  '20000000-0000-0000-0000-000000000007',
  'Setup CI/CD pipeline',
  'Configure GitHub Actions',
  'medium',
  'done',
  120,
  '2026-01-03',
  false,
  'user',
  '00000000-0000-0000-0000-000000000005', -- Employee2
  NULL,
  '00000000-0000-0000-0000-000000000002', -- Manager1
  '00000000-0000-0000-0000-000000000002'  -- Manager1
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. Plan Slots (for ETA calculation)
-- ============================================================================
-- Plan slots for Task 1 (should calculate ETA)
INSERT INTO public.plan_slots (
  task_id, user_id, period, allow_overlap, created_by_user_id
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '["2026-01-05 14:00:00+00","2026-01-05 16:00:00+00")', -- 2 hours
    false,
    '00000000-0000-0000-0000-000000000004'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '["2026-01-06 10:00:00+00","2026-01-06 12:00:00+00")', -- 2 hours (latest slot - this will be ETA)
    false,
    '00000000-0000-0000-0000-000000000004'
  )
ON CONFLICT DO NOTHING;

-- Plan slots for Task 4
INSERT INTO public.plan_slots (
  task_id, user_id, period, allow_overlap, created_by_user_id
) VALUES
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '["2026-01-07 09:00:00+00","2026-01-07 12:00:00+00")', -- 3 hours
    false,
    '00000000-0000-0000-0000-000000000005'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Summary of test data:
-- ============================================================================
-- Users:
--   - Admin (admin@test.com)
--   - Manager1 (manager1@test.com) - manages Engineering
--   - Manager2 (manager2@test.com) - manages Product
--   - Employee1 (employee1@test.com) - Engineering dept
--   - Employee2 (employee2@test.com) - Engineering dept
--   - Employee3 (employee3@test.com) - Product dept
--
-- Tasks:
--   1. Public, assigned to Employee1, status: in_progress, priority: high, has ETA
--   2. PRIVATE, assigned to Employee1, status: todo, priority: medium, no ETA
--   3. Public, assigned to Engineering dept, status: todo, priority: high, no ETA
--   4. Public, assigned to Employee2, status: in_progress, priority: medium, has ETA
--   5. Public, assigned to Employee3 (Product), status: todo, priority: low, no ETA
--   6. Public, assigned to Employee1, status: blocked, priority: high, no ETA
--   7. Public, assigned to Employee2, status: done, priority: medium, no ETA
--
-- Expected RLS behavior:
--   - Employee1 should see: tasks 1, 2, 3, 6 (own tasks + dept tasks)
--   - Employee2 should see: tasks 3, 4, 7 (own tasks + dept tasks)
--   - Employee3 should see: task 5 (own task)
--   - Manager1 should see: tasks 1, 2, 3, 4, 6, 7 (Engineering dept) + task 5 (cross-view to Product)
--   - Manager2 should see: task 5 (Product dept)
--   - Admin should see: all tasks
--
-- Privacy masking:
--   - Task 2 description should be masked for everyone except Employee1, Manager1, and Admin

