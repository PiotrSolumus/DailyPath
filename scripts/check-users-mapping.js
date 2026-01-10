/**
 * Check and fix user mappings between auth.users and public.users
 * Run with: node scripts/check-users-mapping.js
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

async function checkAndFixMappings() {
  console.log('🔍 Checking user mappings...\n');

  // Get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  // Get all public users
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('*');
  
  if (publicError) {
    console.error('❌ Error fetching public users:', publicError);
    return;
  }

  console.log(`Found ${authUsers.users.length} auth users and ${publicUsers?.length || 0} public users\n`);

  const usersToUpsert = [];

  for (const authUser of authUsers.users) {
    const email = authUser.email;
    const authUserId = authUser.id;
    const role = roleMapping[email] || 'employee';
    
    console.log(`📝 Checking: ${email} (Auth ID: ${authUserId})`);

    const publicUser = publicUsers?.find(u => u.email === email);

    if (!publicUser) {
      console.log(`   ⚠️  Not found in public.users - will create`);
      usersToUpsert.push({
        id: authUserId,
        email: email,
        full_name: email.split('@')[0].replace(/[0-9]/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        app_role: role,
        timezone: 'UTC',
        is_active: true
      });
    } else if (publicUser.id !== authUserId) {
      console.log(`   ⚠️  User ID mismatch! Current: ${publicUser.id}, Should be: ${authUserId}`);
      usersToUpsert.push({
        id: authUserId,
        email: email,
        full_name: publicUser.full_name,
        app_role: role,
        timezone: publicUser.timezone || 'UTC',
        is_active: true
      });
    } else {
      console.log(`   ✅ Mapping is correct`);
    }

    console.log('');
  }

  if (usersToUpsert.length > 0) {
    console.log(`\n💾 Upserting ${usersToUpsert.length} users...\n`);
    
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(usersToUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error('❌ Error upserting users:', upsertError);
    } else {
      console.log('✅ Users updated successfully!');
    }
  } else {
    console.log('✅ All mappings are correct!');
  }

  console.log('\n🎉 Check complete!');
}

checkAndFixMappings().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
