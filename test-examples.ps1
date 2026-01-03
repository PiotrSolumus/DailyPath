# Test Examples for GET /api/tasks API
# PowerShell script for testing API endpoints
# 
# SETUP: First create test users and get JWT tokens using .ai/manual-setup-guide.md
# Then replace $TOKEN variables below with actual JWT tokens

# ============================================================================
# Configuration
# ============================================================================
$BaseUrl = "http://localhost:3000"

# Replace these with actual JWT tokens after creating users
$AdminToken = "YOUR_ADMIN_JWT_TOKEN_HERE"
$Manager1Token = "YOUR_MANAGER1_JWT_TOKEN_HERE"
$Employee1Token = "YOUR_EMPLOYEE1_JWT_TOKEN_HERE"

# ============================================================================
# Test 1: Unauthorized Request (Expected: 401)
# ============================================================================
Write-Host "`n=== Test 1: Unauthorized Request ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks" -Method GET
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ PASS: Got 401 Unauthorized as expected" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Got $statusCode instead of 401" -ForegroundColor Red
    }
}

# ============================================================================
# Test 2: Invalid Status Parameter (Expected: 400)
# ============================================================================
Write-Host "`n=== Test 2: Invalid Status Parameter ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks?status=invalid" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    Write-Host "❌ FAIL: Should have returned 400" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS: Got 400 Bad Request" -ForegroundColor Green
        Write-Host "Error details:" -ForegroundColor Yellow
        Write-Host ($errorBody | ConvertTo-Json -Depth 3)
    } else {
        Write-Host "❌ FAIL: Got $statusCode instead of 400" -ForegroundColor Red
    }
}

# ============================================================================
# Test 3: Invalid UUID Format (Expected: 400)
# ============================================================================
Write-Host "`n=== Test 3: Invalid UUID Format ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks?department_id=not-a-uuid" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    Write-Host "❌ FAIL: Should have returned 400" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS: Got 400 Bad Request" -ForegroundColor Green
        Write-Host "Error details:" -ForegroundColor Yellow
        Write-Host ($errorBody | ConvertTo-Json -Depth 3)
    } else {
        Write-Host "❌ FAIL: Got $statusCode instead of 400" -ForegroundColor Red
    }
}

# ============================================================================
# Test 4: Valid Request - All Tasks (Expected: 200)
# ============================================================================
Write-Host "`n=== Test 4: Valid Request - All Tasks ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Got 200 OK" -ForegroundColor Green
        $tasks = $response.Content | ConvertFrom-Json
        Write-Host "Tasks returned: $($tasks.Count)" -ForegroundColor Yellow
        
        if ($tasks.Count -gt 0) {
            Write-Host "`nFirst task:" -ForegroundColor Yellow
            Write-Host ($tasks[0] | ConvertTo-Json -Depth 2)
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# Test 5: Filter by Status (Expected: 200)
# ============================================================================
Write-Host "`n=== Test 5: Filter by Status = 'todo' ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks?status=todo" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Got 200 OK" -ForegroundColor Green
        $tasks = $response.Content | ConvertFrom-Json
        Write-Host "Tasks with status 'todo': $($tasks.Count)" -ForegroundColor Yellow
        
        # Verify all tasks have status 'todo'
        $allTodo = $tasks | Where-Object { $_.status -eq 'todo' } | Measure-Object | Select-Object -ExpandProperty Count
        if ($allTodo -eq $tasks.Count) {
            Write-Host "✅ All tasks have correct status" -ForegroundColor Green
        } else {
            Write-Host "❌ Some tasks have wrong status" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# Test 6: Filter by Priority (Expected: 200)
# ============================================================================
Write-Host "`n=== Test 6: Filter by Priority = 'high' ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks?priority=high" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Got 200 OK" -ForegroundColor Green
        $tasks = $response.Content | ConvertFrom-Json
        Write-Host "Tasks with priority 'high': $($tasks.Count)" -ForegroundColor Yellow
        
        # Verify all tasks have priority 'high'
        $allHigh = $tasks | Where-Object { $_.priority -eq 'high' } | Measure-Object | Select-Object -ExpandProperty Count
        if ($allHigh -eq $tasks.Count) {
            Write-Host "✅ All tasks have correct priority" -ForegroundColor Green
        } else {
            Write-Host "❌ Some tasks have wrong priority" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# Test 7: Combined Filters (Expected: 200)
# ============================================================================
Write-Host "`n=== Test 7: Combined Filters (status=in_progress & priority=high) ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks?status=in_progress&priority=high" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Got 200 OK" -ForegroundColor Green
        $tasks = $response.Content | ConvertFrom-Json
        Write-Host "Tasks matching both filters: $($tasks.Count)" -ForegroundColor Yellow
        
        # Verify all tasks match both criteria
        $allMatch = $tasks | Where-Object { $_.status -eq 'in_progress' -and $_.priority -eq 'high' } | Measure-Object | Select-Object -ExpandProperty Count
        if ($allMatch -eq $tasks.Count) {
            Write-Host "✅ All tasks match both filters" -ForegroundColor Green
        } else {
            Write-Host "❌ Some tasks don't match filters" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# Test 8: Privacy Masking - Private Task as Owner (Expected: 200 with description)
# ============================================================================
Write-Host "`n=== Test 8: Privacy Masking - As Task Owner ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks?is_private=true" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"  # Employee1 owns the private task
    }
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Got 200 OK" -ForegroundColor Green
        $tasks = $response.Content | ConvertFrom-Json
        $privateTasks = $tasks | Where-Object { $_.is_private -eq $true }
        
        Write-Host "Private tasks visible: $($privateTasks.Count)" -ForegroundColor Yellow
        
        if ($privateTasks.Count -gt 0) {
            $taskWithDescription = $privateTasks | Where-Object { $null -ne $_.description } | Measure-Object | Select-Object -ExpandProperty Count
            
            if ($taskWithDescription -gt 0) {
                Write-Host "✅ PASS: Owner can see private task description" -ForegroundColor Green
                Write-Host "`nPrivate task:" -ForegroundColor Yellow
                Write-Host ($privateTasks[0] | ConvertTo-Json -Depth 2)
            } else {
                Write-Host "❌ FAIL: Description is masked for owner" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# Test 9: ETA Calculation (Expected: 200 with eta field)
# ============================================================================
Write-Host "`n=== Test 9: ETA Calculation ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Got 200 OK" -ForegroundColor Green
        $tasks = $response.Content | ConvertFrom-Json
        
        # Check for tasks with ETA
        $tasksWithEta = $tasks | Where-Object { $null -ne $_.eta }
        Write-Host "Tasks with ETA: $($tasksWithEta.Count)" -ForegroundColor Yellow
        
        if ($tasksWithEta.Count -gt 0) {
            Write-Host "✅ PASS: ETA is calculated for tasks with plan_slots" -ForegroundColor Green
            Write-Host "`nExample task with ETA:" -ForegroundColor Yellow
            Write-Host "  Title: $($tasksWithEta[0].title)"
            Write-Host "  ETA: $($tasksWithEta[0].eta)"
        }
        
        # Check for tasks without ETA
        $tasksWithoutEta = $tasks | Where-Object { $null -eq $_.eta }
        Write-Host "Tasks without ETA: $($tasksWithoutEta.Count)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# Test 10: RLS Policies - Employee sees only accessible tasks
# ============================================================================
Write-Host "`n=== Test 10: RLS Policies - Employee Access ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/tasks" -Method GET -Headers @{
        "Authorization" = "Bearer $Employee1Token"
    }
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Got 200 OK" -ForegroundColor Green
        $tasks = $response.Content | ConvertFrom-Json
        
        Write-Host "Tasks visible to Employee1: $($tasks.Count)" -ForegroundColor Yellow
        Write-Host "`nExpected: Tasks assigned to Employee1 + Engineering department tasks" -ForegroundColor Gray
        
        # Count tasks by assignment type
        $ownTasks = $tasks | Where-Object { $_.assigned_user_id -eq '00000000-0000-0000-0000-000000000004' } | Measure-Object | Select-Object -ExpandProperty Count
        $deptTasks = $tasks | Where-Object { $_.assigned_to_type -eq 'department' } | Measure-Object | Select-Object -ExpandProperty Count
        
        Write-Host "  - Own tasks: $ownTasks" -ForegroundColor Yellow
        Write-Host "  - Department tasks: $deptTasks" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "`n`n======================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETED" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`nReview the results above to verify API functionality." -ForegroundColor White
Write-Host "`nNote: Tests 4-10 require valid JWT tokens." -ForegroundColor Yellow
Write-Host "Follow .ai/manual-setup-guide.md to create users and get tokens." -ForegroundColor Yellow

