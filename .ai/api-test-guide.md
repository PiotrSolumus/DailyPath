# API Testing Guide: GET /api/tasks

## Setup

1. Start the development server:
```bash
npm run dev
```

2. Ensure Supabase is running (local or remote)

## Authentication

All requests require a valid Supabase session. You can:
- Use browser cookies (after login)
- Use Bearer token in Authorization header

## Test Scenarios

### 1. Basic Request - Get All Tasks
```bash
curl -X GET "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "priority": "high",
    "status": "in_progress",
    "estimate_minutes": 240,
    "due_date": "2026-01-10",
    "assigned_to_type": "user",
    "assigned_user_id": "uuid",
    "assigned_department_id": null,
    "assigned_by_user_id": "uuid",
    "created_by_user_id": "uuid",
    "is_private": false,
    "eta": "2026-01-05T16:00:00Z"
  }
]
```

### 2. Filter by Status
```bash
curl -X GET "http://localhost:3000/api/tasks?status=todo" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Filter by Priority
```bash
curl -X GET "http://localhost:3000/api/tasks?priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Filter by Department
```bash
curl -X GET "http://localhost:3000/api/tasks?department_id=DEPT_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Filter by Assigned User
```bash
curl -X GET "http://localhost:3000/api/tasks?assigned_to_user_id=USER_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Filter Private Tasks
```bash
curl -X GET "http://localhost:3000/api/tasks?is_private=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Combined Filters
```bash
curl -X GET "http://localhost:3000/api/tasks?status=in_progress&priority=high&is_private=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Scenarios

### 1. Unauthorized (No Token)
```bash
curl -X GET "http://localhost:3000/api/tasks"
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication required"
}
```

### 2. Invalid Status Value
```bash
curl -X GET "http://localhost:3000/api/tasks?status=invalid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (400):**
```json
{
  "error": "Invalid query parameters",
  "message": "One or more query parameters are invalid",
  "details": {
    "status": ["Invalid enum value. Expected 'todo' | 'in_progress' | 'blocked' | 'done'"]
  }
}
```

### 3. Invalid UUID Format
```bash
curl -X GET "http://localhost:3000/api/tasks?department_id=not-a-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (400):**
```json
{
  "error": "Invalid query parameters",
  "message": "One or more query parameters are invalid",
  "details": {
    "department_id": ["Invalid uuid"]
  }
}
```

## Privacy Masking Tests

### Test Case: Private Task Visibility

1. **As Task Owner**: Description should be visible
2. **As Department Manager**: Description should be visible
3. **As Admin**: Description should be visible
4. **As Other User**: Description should be `null`

```bash
# Create a private task and test with different user roles
curl -X GET "http://localhost:3000/api/tasks?is_private=true" \
  -H "Authorization: Bearer OWNER_TOKEN"
# Expected: Full description

curl -X GET "http://localhost:3000/api/tasks?is_private=true" \
  -H "Authorization: Bearer OTHER_USER_TOKEN"
# Expected: description = null
```

## RLS Policy Tests

### Test Case: Employee Access
- Employee should only see:
  - Tasks assigned to them
  - Tasks assigned to their department

### Test Case: Manager Access
- Manager should see:
  - Their own tasks
  - Tasks assigned to users in their managed departments
  - Tasks assigned to their managed departments
  - Tasks in cross-view departments (read-only)

### Test Case: Admin Access
- Admin should see all tasks

## Performance Tests

### Load Testing
```bash
# Apache Bench example
ab -n 1000 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/tasks"
```

**Expected:**
- p90 response time < 2000ms
- p50 response time < 500ms
- Error rate < 1%

## Verification Checklist

- [ ] Endpoint returns 200 for valid authenticated requests
- [ ] Endpoint returns 401 for unauthenticated requests
- [ ] Endpoint returns 400 for invalid query parameters
- [ ] All filters work correctly (status, priority, department, user, private)
- [ ] Combined filters work correctly
- [ ] ETA is calculated correctly from plan_slots
- [ ] Privacy masking works for private tasks
- [ ] RLS policies enforce correct access control per role
- [ ] Empty results return [] with 200 status
- [ ] Response includes proper Cache-Control headers
- [ ] No TypeScript compilation errors
- [ ] No linter errors

## Notes

- Use browser DevTools Network tab for easier testing with session cookies
- Check Supabase Dashboard for query performance metrics
- Monitor console logs for any errors during testing

