# REST API Plan

## 1. Resources
| Resource | Description | DB Table |
| :--- | :--- | :--- |
| **Auth** | User authentication and session management | `auth.users` |
| **Users** | User profiles, roles, and preferences | `public.users` |
| **Departments** | Organizational units and hierarchies | `public.departments` |
| **Memberships** | User-department associations (time-bound) | `public.memberships` |
| **Working Hours** | User's weekly availability schedule | `public.user_working_hours` |
| **Tasks** | Work items with priority, status, and estimates | `public.tasks` |
| **Plan Slots** | Calendar entries (15m increments) | `public.plan_slots` |
| **Time Logs** | Actual work recorded against tasks | `public.time_logs` |
| **Events** | Analytics and audit tracking | `public.events` |

## 2. Endpoints

### 2.1 Users & Profile
#### `GET /api/users/me`
- **Description**: Returns the current authenticated user's profile and active department.
- **Response (200 OK)**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "app_role": "employee",
    "timezone": "Europe/Warsaw",
    "active_department": { "id": "uuid", "name": "Engineering" }
  }
  ```

#### `GET /api/users/:id/working-hours`
- **Description**: Returns the weekly working hour configuration for a user.
- **Response (200 OK)**:
  ```json
  {
    "user_id": "uuid",
    "schedule": [
      { "weekday": 1, "periods": ["[480, 720)", "[780, 1020)"] }
    ]
  }
  ```

### 2.2 Tasks
#### `GET /api/tasks`
- **Description**: List tasks with filtering for dashboard/plan view.
- **Query Params**: `status`, `priority`, `department_id`, `assigned_to_user_id`, `is_private`.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "title": "Task Name",
      "description": "...", 
      "priority": "high",
      "status": "todo",
      "estimate_minutes": 120,
      "assigned_to_type": "user",
      "assigned_user_id": "uuid",
      "created_by": "uuid",
      "is_private": false,
      "eta": "2026-01-03T16:00:00Z" 
    }
  ]
  ```
  *Note: Description is NULL for private tasks if the requester is not the owner or a manager.*

#### `POST /api/tasks`
- **Payload**: `title`, `description`, `priority`, `estimate_minutes`, `assigned_to_type`, `assigned_id`, `is_private`.
- **Validation**: `estimate_minutes > 0`.

#### `PATCH /api/tasks/:id`
- **Description**: Update task details or change status.
- **Payload**: Partial task object (e.g., `{"status": "done"}`).
- **Logic**: If status is set to `done`, the task is closed and ETA is finalized.

### 2.3 Planning (Calendar)
#### `GET /api/plan-slots`
- **Description**: Get plan entries for a specific user and date range.
- **Query Params**: `user_id` (required), `start_date` (required), `end_date` (required).
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "task_id": "uuid",
      "period": "[2026-01-03T08:00:00Z, 2026-01-03T09:30:00Z)",
      "allow_overlap": false
    }
  ]
  ```

#### `POST /api/plan-slots`
- **Payload**: `task_id`, `user_id`, `period` (tstzrange), `allow_overlap`.
- **Validation**: 
  - Must be 15-minute aligned.
  - Only Managers can create slots for other users.
  - If `allow_overlap` is false and an overlap exists, returns 409 Conflict.

### 2.4 Time Tracking
#### `POST /api/time-logs`
- **Payload**: `task_id`, `period` (tstzrange).
- **Validation**: 
  - 15-minute alignment.
  - Triggers `daily_active_update` event if it's the first log of the day.

#### `PATCH /api/time-logs/:id`
- **Validation**: Rejected if `period.end` is older than 7 days.

### 2.5 Reports & Analytics
#### `GET /api/reports/daily`
- **Query Params**: `date`, `department_id`, `user_id`.
- **Response**: Aggregated time logs and task statuses.

#### `POST /api/events`
- **Payload**: `event_type` (`manager_view_render`), `props` (JSON with `duration_ms`, `target_user_id`).

## 3. Authentication and Authorization
- **Mechanism**: Supabase Auth (JWT via `Authorization: Bearer <token>` or Cookie-based for SSR).
- **Authorization**: 
  - **RLS**: Enforced at the database level using `current_setting('request.jwt.claims')`.
  - **Middleware**: Astro middleware verifies the session and attaches the user role/ID to the request context.

## 4. Validation and Business Logic

### 4.1 Global Validations
- **Time Alignment**: All `period` ranges must start and end at `:00`, `:15`, `:30`, or `:45` minutes.
- **Roles**: 
  - `Admin`: Can modify all organizational data (departments, memberships).
  - `Manager`: Can plan slots for any user in their department; can view all tasks in their department.
  - `Employee`: Can only plan their own slots; can only log time for tasks assigned to them or their department.

### 4.2 Business Rules
1. **Overlap Handling**: `POST /plan-slots` returns a `409` with a `suggest_overlap: true` flag if a collision is detected. The client must then re-submit with `allow_overlap: true`.
2. **Private Tasks**: The `tasks_public` view logic is replicated in the API response layer to ensure `description` masking.
3. **7-Day Log Limit**: Enforced via API validation and RLS `UPDATE/DELETE` triggers.
4. **ETA Logic**: Calculated dynamically in `GET /api/tasks` by summing planned slots. If `sum(plan_slots.duration) >= task.estimate_minutes`, the `eta` is the `upper(period)` of the latest slot.
5. **Daily Active Update**: Automatically tracked via `events` table when `POST /api/plan-slots` or `POST /api/time-logs` is called for the first time in a user's local day.

