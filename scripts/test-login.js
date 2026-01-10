/**
 * Test login with admin@test.com
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, anonKey);

async function testLogin() {
  console.log('🔐 Testing login with admin@test.com...\n');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'test123test'
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    return;
  }

  console.log('✅ Login successful!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', data.user.email);
  
  // Try to fetch user profile
  console.log('\n📝 Fetching user profile from public.users...');
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, app_role')
    .eq('id', data.user.id)
    .single();

  if (userError) {
    console.error('❌ Error fetching profile:', userError);
    return;
  }

  console.log('✅ Profile found!');
  console.log('   ID:', userData.id);
  console.log('   Email:', userData.email);
  console.log('   Name:', userData.full_name);
  console.log('   Role:', userData.app_role);
  
  console.log('\n🎉 Login flow works perfectly!');
}

testLogin().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
