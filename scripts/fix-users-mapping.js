/**
 * Fix user mappings by deleting and recreating public.users records
 * Run with: node scripts/fix-users-mapping.js
 */

import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const roleMapping = {
  'admin@test.com': 'admin',
  'manager1@test.com': 'manager',
  'manager2@test.com': 'manager',
  'employee1@test.com': 'employee',
  'employee2@test.com': 'employee',
  'employee3@test.com': 'employee'
};

async function fixMappings() {
  console.log('🔧 Fixing user mappings...\n');

  // Get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  console.log(`Found ${authUsers.users.length} auth users\n`);

  // Delete all existing users from public.users
  console.log('🗑️  Deleting all existing public.users records...');
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

  if (deleteError) {
    console.error('❌ Error deleting users:', deleteError);
    return;
  }
  console.log('✅ Deleted all records\n');

  // Insert new users with correct IDs
  const usersToInsert = authUsers.users
    .filter(authUser => roleMapping[authUser.email]) // Only test users
    .map(authUser => ({
      id: authUser.id, // Use auth user ID as primary key
      email: authUser.email,
      full_name: authUser.email.split('@')[0].replace(/[0-9]/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      app_role: roleMapping[authUser.email],
      timezone: 'UTC',
      is_active: true
    }));

  console.log(`📝 Inserting ${usersToInsert.length} users with correct mappings...\n`);

  for (const user of usersToInsert) {
    console.log(`   • ${user.email} (ID: ${user.id}, Role: ${user.app_role})`);
  }

  const { data, error: insertError } = await supabase
    .from('users')
    .insert(usersToInsert)
    .select();

  if (insertError) {
    console.error('\n❌ Error inserting users:', insertError);
    return;
  }

  console.log('\n✅ Successfully created all users!');
  console.log('\n🎉 Mappings fixed! You can now login with:');
  console.log('   Email: admin@test.com');
  console.log('   Password: test123test');
}

fixMappings().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
