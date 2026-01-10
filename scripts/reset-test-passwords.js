/**
 * Reset passwords for test users in Supabase Auth
 * Run with: node scripts/reset-test-passwords.js
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

const testUsers = [
  'admin@test.com',
  'manager1@test.com',
  'manager2@test.com',
  'employee1@test.com',
  'employee2@test.com',
  'employee3@test.com'
];

async function resetPasswords() {
  console.log('🔐 Resetting passwords for test users...\n');

  for (const email of testUsers) {
    try {
      console.log(`📝 Finding user: ${email}...`);

      // Get all users and find by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`   ❌ Error listing users: ${listError.message}`);
        continue;
      }

      const user = users.users.find(u => u.email === email);

      if (!user) {
        console.log(`   ⚠️  User not found, skipping...`);
        continue;
      }

      console.log(`   ✅ Found user ID: ${user.id}`);
      console.log(`   🔑 Resetting password to: test123test`);

      // Update user password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: 'test123test' }
      );

      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Password reset successfully`);
      }

      console.log('');
    } catch (err) {
      console.error(`   ❌ Unexpected error: ${err.message}\n`);
    }
  }

  console.log('🎉 Password reset complete!');
  console.log('\n📚 All test users now have password: test123test');
}

resetPasswords().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
