/**
 * Seed script for test data
 * Run with: node scripts/seed-database.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // NOTE: Users should be created first by running: node scripts/create-test-users.js
    // That script creates users in both auth.users and public.users

    // 1. Insert departments
    console.log('📝 Inserting departments...');
    const { error: deptsError } = await supabase.from('departments').upsert([
      { id: '10000000-0000-0000-0000-000000000001', name: 'Engineering' },
      { id: '10000000-0000-0000-0000-000000000002', name: 'Product' },
      { id: '10000000-0000-0000-0000-000000000003', name: 'Marketing' },
    ], { onConflict: 'name' });

    if (deptsError) {
      console.error('❌ Error inserting departments:', deptsError);
      return;
    }
    console.log('✅ Departments inserted\n');

    // 2. Insert department managers
    console.log('📝 Inserting department managers...');
    const { error: dmError } = await supabase.from('department_managers').upsert([
      { manager_user_id: '00000000-0000-0000-0000-000000000002', department_id: '10000000-0000-0000-0000-000000000001' },
      { manager_user_id: '00000000-0000-0000-0000-000000000003', department_id: '10000000-0000-0000-0000-000000000002' },
    ]);

    if (dmError) {
      console.error('❌ Error inserting department managers:', dmError);
      return;
    }
    console.log('✅ Department managers inserted\n');

    // 3. Insert manager cross views
    console.log('📝 Inserting manager cross views...');
    const { error: cvError } = await supabase.from('manager_cross_views').upsert([
      { manager_user_id: '00000000-0000-0000-0000-000000000002', department_id: '10000000-0000-0000-0000-000000000002' },
    ]);

    if (cvError) {
      console.error('❌ Error inserting cross views:', cvError);
      return;
    }
    console.log('✅ Manager cross views inserted\n');

    // 4. Insert memberships
    console.log('📝 Inserting memberships...');
    const { error: membError } = await supabase.from('memberships').upsert([
      { user_id: '00000000-0000-0000-0000-000000000004', department_id: '10000000-0000-0000-0000-000000000001', period: '[2026-01-01,2026-12-31)' },
      { user_id: '00000000-0000-0000-0000-000000000005', department_id: '10000000-0000-0000-0000-000000000001', period: '[2026-01-01,2026-12-31)' },
      { user_id: '00000000-0000-0000-0000-000000000006', department_id: '10000000-0000-0000-0000-000000000002', period: '[2026-01-01,2026-12-31)' },
    ]);

    if (membError) {
      console.error('❌ Error inserting memberships:', membError);
      return;
    }
    console.log('✅ Memberships inserted\n');

    // 5. Insert tasks
    console.log('📝 Inserting tasks...');
    const { error: tasksError } = await supabase.from('tasks').upsert([
      {
        id: '20000000-0000-0000-0000-000000000001',
        title: 'Implement user authentication',
        description: 'Set up Supabase auth with RLS policies',
        priority: 'high',
        status: 'in_progress',
        estimate_minutes: 240,
        due_date: '2026-01-10',
        is_private: false,
        assigned_to_type: 'user',
        assigned_user_id: '00000000-0000-0000-0000-000000000004',
        assigned_department_id: null,
        assigned_by_user_id: '00000000-0000-0000-0000-000000000002',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        title: 'Personal development task',
        description: 'This is a private description that should be masked',
        priority: 'medium',
        status: 'todo',
        estimate_minutes: 120,
        due_date: null,
        is_private: true,
        assigned_to_type: 'user',
        assigned_user_id: '00000000-0000-0000-0000-000000000004',
        assigned_department_id: null,
        assigned_by_user_id: '00000000-0000-0000-0000-000000000004',
        created_by_user_id: '00000000-0000-0000-0000-000000000004',
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        title: 'Refactor database schema',
        description: 'Update migrations and add indexes',
        priority: 'high',
        status: 'todo',
        estimate_minutes: 480,
        due_date: '2026-01-15',
        is_private: false,
        assigned_to_type: 'department',
        assigned_user_id: null,
        assigned_department_id: '10000000-0000-0000-0000-000000000001',
        assigned_by_user_id: '00000000-0000-0000-0000-000000000002',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        title: 'Write API documentation',
        description: 'Document all endpoints with examples',
        priority: 'medium',
        status: 'in_progress',
        estimate_minutes: 180,
        due_date: '2026-01-08',
        is_private: false,
        assigned_to_type: 'user',
        assigned_user_id: '00000000-0000-0000-0000-000000000005',
        assigned_department_id: null,
        assigned_by_user_id: '00000000-0000-0000-0000-000000000002',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      },
      {
        id: '20000000-0000-0000-0000-000000000005',
        title: 'Design new feature mockups',
        description: 'Create Figma designs for dashboard',
        priority: 'low',
        status: 'todo',
        estimate_minutes: 300,
        due_date: '2026-01-20',
        is_private: false,
        assigned_to_type: 'user',
        assigned_user_id: '00000000-0000-0000-0000-000000000006',
        assigned_department_id: null,
        assigned_by_user_id: '00000000-0000-0000-0000-000000000003',
        created_by_user_id: '00000000-0000-0000-0000-000000000003',
      },
      {
        id: '20000000-0000-0000-0000-000000000006',
        title: 'Deploy to production',
        description: 'Waiting for QA approval',
        priority: 'high',
        status: 'blocked',
        estimate_minutes: 60,
        due_date: '2026-01-05',
        is_private: false,
        assigned_to_type: 'user',
        assigned_user_id: '00000000-0000-0000-0000-000000000004',
        assigned_department_id: null,
        assigned_by_user_id: '00000000-0000-0000-0000-000000000002',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      },
      {
        id: '20000000-0000-0000-0000-000000000007',
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions',
        priority: 'medium',
        status: 'done',
        estimate_minutes: 120,
        due_date: '2026-01-03',
        is_private: false,
        assigned_to_type: 'user',
        assigned_user_id: '00000000-0000-0000-0000-000000000005',
        assigned_department_id: null,
        assigned_by_user_id: '00000000-0000-0000-0000-000000000002',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      },
    ], { onConflict: 'id' });

    if (tasksError) {
      console.error('❌ Error inserting tasks:', tasksError);
      return;
    }
    console.log('✅ Tasks inserted\n');

    // 6. Insert plan slots
    console.log('📝 Inserting plan slots...');
    const { error: slotsError } = await supabase.from('plan_slots').upsert([
      {
        task_id: '20000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000004',
        period: '["2026-01-05 14:00:00+00","2026-01-05 16:00:00+00")',
        allow_overlap: false,
        created_by_user_id: '00000000-0000-0000-0000-000000000004',
      },
      {
        task_id: '20000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000004',
        period: '["2026-01-06 10:00:00+00","2026-01-06 12:00:00+00")',
        allow_overlap: false,
        created_by_user_id: '00000000-0000-0000-0000-000000000004',
      },
      {
        task_id: '20000000-0000-0000-0000-000000000004',
        user_id: '00000000-0000-0000-0000-000000000005',
        period: '["2026-01-07 09:00:00+00","2026-01-07 12:00:00+00")',
        allow_overlap: false,
        created_by_user_id: '00000000-0000-0000-0000-000000000005',
      },
    ]);

    if (slotsError) {
      console.error('❌ Error inserting plan slots:', slotsError);
      return;
    }
    console.log('✅ Plan slots inserted\n');

    console.log('🎉 Database seeded successfully!\n');
    console.log('Test users:');
    console.log('  - admin@test.com (Admin)');
    console.log('  - manager1@test.com (Manager - Engineering)');
    console.log('  - manager2@test.com (Manager - Product)');
    console.log('  - employee1@test.com (Employee - Engineering)');
    console.log('  - employee2@test.com (Employee - Engineering)');
    console.log('  - employee3@test.com (Employee - Product)');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

seedDatabase();

