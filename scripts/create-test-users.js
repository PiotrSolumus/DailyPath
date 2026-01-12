/**
 * Create test users in Supabase Auth
 * Run with: node scripts/create-test-users.js
 *
 * This script creates users using the Supabase Admin API
 * which requires the service_role key (full access)
 */

import { createClient } from "@supabase/supabase-js";

// Local Supabase configuration
const supabaseUrl = "http://127.0.0.1:54321";
// Service role key for admin operations (from terminal output)
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Create admin client (service_role key has full access)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUsers = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@test.com",
    password: "test123test",
    user_metadata: {},
    app_metadata: { app_role: "admin" },
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "manager1@test.com",
    password: "test123test",
    user_metadata: {},
    app_metadata: { app_role: "manager" },
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "manager2@test.com",
    password: "test123test",
    user_metadata: {},
    app_metadata: { app_role: "manager" },
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "employee1@test.com",
    password: "test123test",
    user_metadata: {},
    app_metadata: { app_role: "employee" },
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    email: "employee2@test.com",
    password: "test123test",
    user_metadata: {},
    app_metadata: { app_role: "employee" },
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    email: "employee3@test.com",
    password: "test123test",
    user_metadata: {},
    app_metadata: { app_role: "employee" },
  },
];

async function createTestUsers() {
  console.log("🔐 Creating test users in Supabase Auth...\n");

  const createdUsers = [];
  const tokens = [];

  for (const userData of testUsers) {
    try {
      console.log(`📝 Creating user: ${userData.email} (${userData.app_metadata.app_role})...`);

      // Create user with Admin API (with specified UUID)
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: userData.user_metadata,
        app_metadata: userData.app_metadata,
        user_id: userData.id, // Use predefined UUID for consistent seeding
      });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        continue;
      }

      if (data.user) {
        console.log(`   ✅ Created user ID: ${data.user.id}`);
        createdUsers.push(data.user);

        // Sign in to get JWT token
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });

        if (signInError) {
          console.error(`   ⚠️  Could not get token: ${signInError.message}`);
        } else if (signInData.session) {
          console.log(`   🔑 Token obtained (${signInData.session.access_token.substring(0, 20)}...)`);
          tokens.push({
            email: userData.email,
            role: userData.app_metadata.app_role,
            token: signInData.session.access_token,
          });
        }

        // Sign out to clear session for next user
        await supabase.auth.signOut();
      }

      console.log("");
    } catch (err) {
      console.error(`   ❌ Unexpected error: ${err.message}\n`);
    }
  }

  // Insert users into public.users table
  console.log("📝 Inserting users into public.users table...\n");

  const publicUsers = testUsers.map((u) => ({
    id: createdUsers.find((cu) => cu.email === u.email)?.id || u.id,
    email: u.email,
    full_name: u.email
      .split("@")[0]
      .replace(/[0-9]/g, " ")
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    app_role: u.app_metadata.app_role,
    timezone: "UTC",
    is_active: true,
  }));

  const { error: publicError } = await supabase.from("users").upsert(publicUsers, { onConflict: "id" });

  if (publicError) {
    console.error("❌ Error inserting into public.users:", publicError);
  } else {
    console.log("✅ Users inserted into public.users\n");
  }

  // Save tokens to file
  console.log("💾 Saving tokens to test-tokens.json...\n");

  const fs = await import("fs");
  fs.writeFileSync("test-tokens.json", JSON.stringify({ tokens, created_at: new Date().toISOString() }, null, 2));

  console.log("✅ Tokens saved!\n");

  // Summary
  console.log("🎉 Summary:\n");
  console.log(`   Created users: ${createdUsers.length}/${testUsers.length}`);
  console.log(`   Obtained tokens: ${tokens.length}/${testUsers.length}`);
  console.log("\nTest users:");
  tokens.forEach((t) => {
    console.log(`   - ${t.email} (${t.role})`);
    console.log(`     Token: ${t.token.substring(0, 30)}...`);
  });

  console.log("\n📚 Credentials for all users:");
  console.log("   Email: <user>@test.com");
  console.log("   Password: test123test");
  console.log("\n✅ You can now use these tokens for API testing!");
}

createTestUsers().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
