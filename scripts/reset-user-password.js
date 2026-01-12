/**
 * Script to reset password for a user
 * Usage: node scripts/reset-user-password.js <email> <new-password>
 */

import { createClient } from "@supabase/supabase-js";

// Local Supabase configuration
const supabaseUrl = "http://127.0.0.1:54321";
// Service role key for admin operations
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error("❌ Please provide both email and new password");
    console.log("Usage: node scripts/reset-user-password.js <email> <new-password>");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error("❌ Password must be at least 6 characters long");
    process.exit(1);
  }

  console.log(`🔐 Resetting password for: ${email}\n`);

  // Get all users and find by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Error listing users:", listError);
    process.exit(1);
  }

  const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Found user ID: ${user.id}`);
  console.log(`🔑 Resetting password...`);

  // Update user password
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateError) {
    console.error(`❌ Error: ${updateError.message}`);
    process.exit(1);
  }

  console.log(`✅ Password reset successfully!`);
  console.log(`\n📝 User can now log in with:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}`);
}

const email = process.argv[2];
const password = process.argv[3];
resetPassword(email, password)
  .then(() => {
    console.log("\n✅ Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
