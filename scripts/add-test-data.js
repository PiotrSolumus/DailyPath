/**
 * Script to add test data for dashboard (tasks and plan slots)
 * Run with: node scripts/add-test-data.js
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
// Use service_role key to bypass RLS for seeding
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseKey);

// Load actual user IDs from test-tokens.json
import fs from "fs";
const tokens = JSON.parse(fs.readFileSync("test-tokens.json", "utf8"));

// Extract user ID from token
const getUserId = (email) => {
  const token = tokens.tokens.find((t) => t.email === email);
  if (!token) throw new Error(`Token not found for ${email}`);
  const payload = JSON.parse(Buffer.from(token.token.split(".")[1], "base64").toString());
  return payload.sub;
};

// Get current date and time
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const currentYear = now.getFullYear();

// Helper to format date for PostgreSQL
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Helper to format datetime for PostgreSQL tstzrange
const formatDateTime = (date) => {
  return date.toISOString();
};

// Helper to create tstzrange
const createPeriod = (start, end) => {
  return `[${formatDateTime(start)},${formatDateTime(end)})`;
};

async function addTestData() {
  console.log("🌱 Adding test data for dashboard...\n");

  try {
    // Get user IDs
    const EMPLOYEE1_ID = getUserId("employee1@test.com");
    const EMPLOYEE2_ID = getUserId("employee2@test.com");
    const MANAGER1_ID = getUserId("manager1@test.com");

    console.log("📋 Using user IDs:");
    console.log(`   Employee1: ${EMPLOYEE1_ID}`);
    console.log(`   Employee2: ${EMPLOYEE2_ID}`);
    console.log(`   Manager1: ${MANAGER1_ID}\n`);

    // 1. Create tasks with various statuses and dates
    console.log("📝 Creating test tasks...");

    const tasks = [];

    // Completed tasks from different months this year
    const months = [
      { month: 0, day: 15 }, // January
      { month: 1, day: 10 }, // February
      { month: 2, day: 20 }, // March
      { month: 3, day: 5 }, // April
      { month: 4, day: 12 }, // May
      { month: 5, day: 25 }, // June
      { month: 6, day: 8 }, // July
      { month: 7, day: 18 }, // August
      { month: 8, day: 3 }, // September
      { month: 9, day: 22 }, // October
      { month: 10, day: 7 }, // November
      { month: 11, day: 15 }, // December
    ];

    // Add completed tasks for each month
    months.forEach(({ month, day }, index) => {
      const completedDate = new Date(currentYear, month, day, 14, 30, 0);
      tasks.push({
        title: `Zadanie zakończone ${completedDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}`,
        description: `Opis zadania zakończonego w ${completedDate.toLocaleDateString("pl-PL", { month: "long" })}`,
        priority: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
        status: "done",
        estimate_minutes: 60 + index * 15,
        due_date: formatDate(completedDate),
        is_private: false,
        assigned_to_type: "user",
        assigned_user_id: EMPLOYEE1_ID,
        assigned_department_id: null,
        assigned_by_user_id: MANAGER1_ID,
        created_by_user_id: MANAGER1_ID,
        updated_at: completedDate.toISOString(),
      });
    });

    // Add more completed tasks for some months (to make chart more interesting)
    for (let i = 0; i < 5; i++) {
      const month = Math.floor(Math.random() * 12);
      const day = Math.floor(Math.random() * 28) + 1;
      const completedDate = new Date(currentYear, month, day, 10 + i, 0, 0);
      tasks.push({
        title: `Dodatkowe zadanie ${i + 1}`,
        description: `Dodatkowe zadanie zakończone w ${completedDate.toLocaleDateString("pl-PL", { month: "long" })}`,
        priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        status: "done",
        estimate_minutes: 90,
        due_date: formatDate(completedDate),
        is_private: false,
        assigned_to_type: "user",
        assigned_user_id: EMPLOYEE1_ID,
        assigned_department_id: null,
        assigned_by_user_id: MANAGER1_ID,
        created_by_user_id: MANAGER1_ID,
        updated_at: completedDate.toISOString(),
      });
    }

    // Add active tasks
    const activeTasks = [
      {
        title: "Implementacja nowej funkcjonalności",
        description: "Dodanie możliwości eksportu raportów",
        priority: "high",
        status: "in_progress",
        estimate_minutes: 240,
        due_date: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
      },
      {
        title: "Refaktoryzacja kodu",
        description: "Uporządkowanie struktury komponentów",
        priority: "medium",
        status: "todo",
        estimate_minutes: 180,
        due_date: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)),
      },
      {
        title: "Aktualizacja dokumentacji",
        description: "Dodanie przykładów użycia API",
        priority: "low",
        status: "todo",
        estimate_minutes: 120,
        due_date: null,
      },
      {
        title: "Optymalizacja zapytań",
        description: "Poprawa wydajności bazy danych",
        priority: "high",
        status: "in_progress",
        estimate_minutes: 300,
        due_date: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
      },
      {
        title: "Testy jednostkowe",
        description: "Pokrycie testami nowych funkcji",
        priority: "medium",
        status: "todo",
        estimate_minutes: 200,
        due_date: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
      },
    ];

    activeTasks.forEach((task) => {
      tasks.push({
        ...task,
        is_private: false,
        assigned_to_type: "user",
        assigned_user_id: EMPLOYEE1_ID,
        assigned_department_id: null,
        assigned_by_user_id: MANAGER1_ID,
        created_by_user_id: MANAGER1_ID,
      });
    });

    // Insert tasks
    const { data: insertedTasks, error: tasksError } = await supabase
      .from("tasks")
      .insert(tasks)
      .select("id, title, status");

    if (tasksError) {
      console.error("❌ Error inserting tasks:", tasksError);
      return;
    }
    console.log(`✅ Created ${insertedTasks.length} tasks\n`);

    // 2. Create plan slots for today
    console.log("📅 Creating plan slots for today...");

    // Get active task IDs (not completed) - match by title and status
    const activeTaskIds = insertedTasks
      .filter((inserted) => {
        const originalTask = tasks.find((t) => t.title === inserted.title);
        return originalTask && originalTask.status !== "done";
      })
      .map((t) => t.id);

    if (activeTaskIds.length === 0) {
      console.log("⚠️  No active tasks to create plan slots for");
      return;
    }

    const planSlots = [];

    // Plan slots for today: 9:00-11:00, 11:00-13:00, 14:00-16:00, 16:00-18:00
    const slotTimes = [
      { start: 9, end: 11 },
      { start: 11, end: 13 },
      { start: 14, end: 16 },
      { start: 16, end: 18 },
    ];

    slotTimes.forEach(({ start, end }, index) => {
      const slotStart = new Date(today);
      slotStart.setHours(start, 0, 0, 0);
      const slotEnd = new Date(today);
      slotEnd.setHours(end, 0, 0, 0);

      // Use task in round-robin fashion
      const taskId = activeTaskIds[index % activeTaskIds.length];

      planSlots.push({
        task_id: taskId,
        user_id: EMPLOYEE1_ID,
        period: createPeriod(slotStart, slotEnd),
        allow_overlap: false,
        created_by_user_id: EMPLOYEE1_ID,
      });
    });

    // Insert plan slots
    const { data: insertedSlots, error: slotsError } = await supabase
      .from("plan_slots")
      .insert(planSlots)
      .select("id");

    if (slotsError) {
      console.error("❌ Error inserting plan slots:", slotsError);
      return;
    }
    console.log(`✅ Created ${insertedSlots.length} plan slots for today\n`);

    console.log("🎉 Test data added successfully!\n");
    console.log(`Summary:`);
    console.log(`  - Tasks created: ${insertedTasks.length}`);
    console.log(`  - Completed tasks: ${tasks.filter((t) => t.status === "done").length}`);
    console.log(`  - Active tasks: ${tasks.filter((t) => t.status !== "done").length}`);
    console.log(`  - Plan slots for today: ${insertedSlots.length}`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

addTestData();
