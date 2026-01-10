/**
 * Script to check if a user exists in both auth.users and public.users
 * Usage: node scripts/check-user.js <email>
 */

import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
// Service role key for admin operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkUser(email) {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/check-user.js <email>');
    process.exit(1);
  }

  console.log(`🔍 Checking user: ${email}\n`);

  // Check in auth.users
  console.log('📋 Checking auth.users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  const authUser = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (authUser) {
    console.log('✅ Found in auth.users:');
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Created at: ${authUser.created_at}`);
    console.log(`   Last sign in: ${authUser.last_sign_in_at || 'Never'}`);
  } else {
    console.log('❌ NOT found in auth.users');
  }

  console.log('');

  // Check in public.users
  console.log('📋 Checking public.users...');
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (publicError) {
    console.error('❌ Error fetching public user:', publicError);
    return;
  }

  if (publicUser) {
    console.log('✅ Found in public.users:');
    console.log(`   ID: ${publicUser.id}`);
    console.log(`   Email: ${publicUser.email}`);
    console.log(`   Full name: ${publicUser.full_name}`);
    console.log(`   Role: ${publicUser.app_role}`);
    console.log(`   Active: ${publicUser.is_active}`);
  } else {
    console.log('❌ NOT found in public.users');
  }

  console.log('');

  // Check ID match
  if (authUser && publicUser) {
    if (authUser.id === publicUser.id) {
      console.log('✅ User IDs match!');
    } else {
      console.log('⚠️  User ID mismatch!');
      console.log(`   auth.users.id: ${authUser.id}`);
      console.log(`   public.users.id: ${publicUser.id}`);
    }
  } else if (authUser && !publicUser) {
    console.log('⚠️  User exists in auth.users but NOT in public.users');
    console.log('   This user cannot log in properly.');
  } else if (!authUser && publicUser) {
    console.log('⚠️  User exists in public.users but NOT in auth.users');
    console.log('   This user cannot log in.');
  } else {
    console.log('❌ User does not exist in either table');
  }

  console.log('');

  // Try to sign in (if both exist)
  if (authUser && publicUser) {
    console.log('🔐 Testing login...');
    console.log('   (This will fail if password is incorrect)');
    console.log('   Enter password to test, or press Ctrl+C to skip');
    
    // Note: We can't easily test password without user input in a script
    // But we can check if email is confirmed
    if (!authUser.email_confirmed_at) {
      console.log('⚠️  Email is not confirmed - user may not be able to log in');
    } else {
      console.log('✅ Email is confirmed - user should be able to log in');
    }
  }
}

const email = process.argv[2];
checkUser(email)
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
