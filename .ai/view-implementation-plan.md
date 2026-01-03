# API Endpoint Implementation Plan: GET /api/tasks

## 1. Przegląd punktu końcowego

Endpoint `GET /api/tasks` umożliwia pobieranie listy zadań z możliwością filtrowania dla widoków dashboardu i planowania. Implementacja wymaga:
- Dynamicznego obliczania ETA na podstawie zaplanowanych slotów (`plan_slots`)
- Maskowania opisów prywatnych zadań dla nieuprzywilejowanych użytkowników
- Przestrzegania polityk RLS na poziomie bazy danych
- Obsługi filtrowania po statusie, priorytecie, dziale i przypisaniu

**Cel biznesowy:** Umożliwienie użytkownikom przeglądania zadań przypisanych do nich lub ich działu, z uwzględnieniem hierarchii uprawnień (employee/manager/admin) i ochrony prywatności.

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/tasks
```

### Parametry Query String

#### Opcjonalne:
- `status` (string) - filtrowanie po statusie zadania
  - Dozwolone wartości: `todo`, `in_progress`, `blocked`, `done`
  - Przykład: `?status=todo`
  
- `priority` (string) - filtrowanie po priorytecie
  - Dozwolone wartości: `low`, `medium`, `high`
  - Przykład: `?priority=high`
  
- `department_id` (uuid) - filtrowanie po dziale
  - Format: UUID v4
  - Przykład: `?department_id=550e8400-e29b-41d4-a716-446655440000`
  
- `assigned_to_user_id` (uuid) - filtrowanie po użytkowniku
  - Format: UUID v4
  - Przykład: `?assigned_to_user_id=550e8400-e29b-41d4-a716-446655440000`
  
- `is_private` (boolean) - filtrowanie po prywatności
  - Dozwolone wartości: `true`, `false`
  - Przykład: `?is_private=true`

### Request Headers
- `Authorization: Bearer <token>` lub sesja cookie (Supabase Auth)
- `Content-Type: application/json`

### Request Body
Brak (GET request)

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// src/types.ts - już zdefiniowane
export interface TaskDTO extends Omit<Tables<'tasks'>, 'created_at' | 'updated_at'> {
  /** Dynamic ETA calculated by summing planned slots */
  eta: string | null;
}
```

### Query Parameters Schema (Zod)

```typescript
// Nowy: src/lib/schemas/task.schema.ts
import { z } from 'zod';

export const taskQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  department_id: z.string().uuid().optional(),
  assigned_to_user_id: z.string().uuid().optional(),
  is_private: z.coerce.boolean().optional()
});

export type TaskQueryParams = z.infer<typeof taskQuerySchema>;
```

### Database Types

```typescript
// Wykorzystane z src/db/database.types.ts
Tables<'tasks'>
Tables<'plan_slots'>
Tables<'memberships'>
Tables<'department_managers'>
Enums<'task_status'>
Enums<'task_priority'>
Enums<'assigned_to_type'>
Enums<'app_role'>
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement user authentication",
    "description": "Set up Supabase auth with RLS policies",
    "priority": "high",
    "status": "in_progress",
    "estimate_minutes": 240,
    "due_date": "2026-01-10",
    "assigned_to_type": "user",
    "assigned_user_id": "660e8400-e29b-41d4-a716-446655440001",
    "assigned_department_id": null,
    "assigned_by_user_id": "770e8400-e29b-41d4-a716-446655440002",
    "created_by_user_id": "770e8400-e29b-41d4-a716-446655440002",
    "is_private": false,
    "eta": "2026-01-05T16:00:00Z"
  },
  {
    "id": "650e8400-e29b-41d4-a716-446655440003",
    "title": "Private task",
    "description": null,
    "priority": "medium",
    "status": "todo",
    "estimate_minutes": 120,
    "due_date": null,
    "assigned_to_type": "user",
    "assigned_user_id": "880e8400-e29b-41d4-a716-446655440004",
    "assigned_department_id": null,
    "assigned_by_user_id": "880e8400-e29b-41d4-a716-446655440004",
    "created_by_user_id": "880e8400-e29b-41d4-a716-446655440004",
    "is_private": true,
    "eta": null
  }
]
```

**Uwaga:** Pole `description` jest maskowane do `null` dla zadań prywatnych (`is_private = true`), gdy użytkownik nie jest właścicielem ani menedżerem działu.

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid query parameters",
  "details": {
    "status": ["Invalid enum value. Expected 'todo' | 'in_progress' | 'blocked' | 'done'"],
    "department_id": ["Invalid uuid"]
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### Architektura warstw

```
Request → Middleware → Endpoint Handler → Service Layer → Database (RLS) → Response
```

### Szczegółowy przepływ

1. **Middleware (`src/middleware/index.ts`)**
   - Weryfikacja sesji użytkownika (Supabase Auth)
   - Wyodrębnienie `user_id` i `app_role` z JWT
   - Ustawienie kontekstu w `locals.user`
   - Przekierowanie do /login jeśli brak autoryzacji

2. **Endpoint Handler (`src/pages/api/tasks/index.ts`)**
   - Odczyt i parsowanie query parameters
   - Walidacja parametrów używając Zod schema
   - Wywołanie service layer z walidowanymi parametrami
   - Obsługa błędów i zwrot odpowiedzi

3. **Service Layer (`src/lib/services/task.service.ts`)**
   - `listTasks(userId, userRole, filters)`:
     - Inicjalizacja klienta Supabase z kontekstem użytkownika
     - Budowanie zapytania z filtrami
     - Wykonanie zapytania (RLS automatycznie filtruje)
     - Dla każdego zadania: wywołanie `calculateTaskETA(taskId)`
     - Dla każdego zadania: wywołanie `applyPrivacyMask(task, userId, userRole)`
     - Zwrot tablicy `TaskDTO[]`

4. **ETA Calculation (`calculateTaskETA`)**
   - Query do `plan_slots` filtrowane po `task_id`
   - Sumowanie długości slotów: `SUM(EXTRACT(EPOCH FROM upper(period) - lower(period)) / 60)`
   - Jeśli suma >= `task.estimate_minutes`:
     - ETA = `upper(period)` najnowszego slotu
   - Jeśli suma < estymacja:
     - ETA = null
   - Cache'owanie wyników w ramach request (Map)

5. **Privacy Masking (`applyPrivacyMask`)**
   - Jeśli `task.is_private = false` → return task bez zmian
   - Jeśli `task.is_private = true`:
     - Check: czy `userId === task.assigned_user_id` → return task
     - Check: czy użytkownik jest menedżerem działu zadania → return task
     - Inaczej: `task.description = null`, return task

6. **Database (PostgreSQL + RLS)**
   - Polityki RLS filtrują zadania na podstawie:
     - Admin: widzi wszystko
     - Manager: widzi zadania działów, którymi zarządza + `manager_cross_views`
     - Employee: widzi własne zadania + zadania przypisane do działu

7. **Response Formatting**
   - Mapowanie database rows na `TaskDTO`
   - Serializacja JSON
   - Zwrot z kodem 200

### Diagram przepływu danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/tasks?status=todo
       ▼
┌─────────────────────────────────────┐
│   Astro Middleware                  │
│   - Verify Supabase session         │
│   - Extract user_id & app_role      │
│   - Set locals.user                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Endpoint Handler                  │
│   /api/tasks/index.ts               │
│   - Parse query params              │
│   - Validate with Zod               │
│   - Call taskService.listTasks()    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Task Service                      │
│   - Build query with filters        │
│   - Execute DB query (RLS applies)  │
│   - Calculate ETA for each task     │
│   - Apply privacy masking           │
└──────┬──────────────────────────────┘
       │
       ├──────┐
       │      ▼
       │   ┌──────────────────────────┐
       │   │ ETA Calculation          │
       │   │ - Query plan_slots       │
       │   │ - Sum durations          │
       │   │ - Determine ETA          │
       │   └──────────────────────────┘
       │
       ├──────┐
       │      ▼
       │   ┌──────────────────────────┐
       │   │ Privacy Masking          │
       │   │ - Check ownership        │
       │   │ - Check manager perms    │
       │   │ - Mask description       │
       │   └──────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   PostgreSQL + RLS                  │
│   - Filter by user role/department  │
│   - Return visible tasks            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Response (200 OK)                 │
│   TaskDTO[]                         │
└─────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Mechanizm:** Supabase Auth z JWT tokens
- **Implementacja:** Middleware Astro weryfikuje sesję przed dostępem do endpointa
- **Cookie-based:** HTTP-only cookies dla SSR (bezpieczniejsze niż localStorage)
- **Token validation:** Automatyczna weryfikacja przez Supabase SDK

### Autoryzacja (RLS Policies)

#### Polityki na poziomie bazy danych (`tasks` table):

**Admin (app_role = 'admin'):**
```sql
CREATE POLICY "admin_all_tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING (
    (SELECT app_role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

**Manager:**
```sql
CREATE POLICY "manager_department_tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING (
    -- Własne zadania
    assigned_user_id = auth.uid()
    OR
    -- Zadania działów, którymi zarządza
    (
      assigned_to_type = 'user' 
      AND assigned_user_id IN (
        SELECT m.user_id 
        FROM memberships m
        JOIN department_managers dm ON dm.department_id = m.department_id
        WHERE dm.manager_user_id = auth.uid()
          AND m.period @> CURRENT_DATE
      )
    )
    OR
    (
      assigned_to_type = 'department'
      AND assigned_department_id IN (
        SELECT department_id 
        FROM department_managers 
        WHERE manager_user_id = auth.uid()
      )
    )
    OR
    -- Read-only cross-view permissions
    assigned_department_id IN (
      SELECT department_id 
      FROM manager_cross_views 
      WHERE manager_user_id = auth.uid()
    )
  );
```

**Employee:**
```sql
CREATE POLICY "employee_own_tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING (
    -- Własne zadania
    assigned_user_id = auth.uid()
    OR
    -- Zadania przypisane do działu użytkownika
    (
      assigned_to_type = 'department'
      AND assigned_department_id IN (
        SELECT department_id 
        FROM memberships 
        WHERE user_id = auth.uid() 
          AND period @> CURRENT_DATE
      )
    )
  );
```

### Maskowanie danych (Privacy)

**Logika aplikacyjna:**
- Implementacja w `applyPrivacyMask()` function
- Dla zadań `is_private = true`:
  - Właściciel (assigned_user_id) → pełny dostęp
  - Menedżer działu właściciela → pełny dostęp
  - Inni → `description = null`

**Zapytanie sprawdzające uprawnienia menedżera:**
```typescript
async function isManagerOfUser(managerId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('memberships')
    .select('department_id')
    .eq('user_id', userId)
    .contains('period', new Date().toISOString())
    .single();
    
  if (!data) return false;
  
  const { count } = await supabase
    .from('department_managers')
    .select('*', { count: 'exact', head: true })
    .eq('manager_user_id', managerId)
    .eq('department_id', data.department_id);
    
  return (count ?? 0) > 0;
}
```

### Walidacja danych wejściowych

**Zod Schema zabezpieczenia:**
- UUID validation (zapobiega SQL injection przez nieprawidłowe UUIDs)
- Enum validation (tylko dozwolone wartości)
- Type coercion dla boolean (bezpieczna konwersja string → boolean)
- Sanityzacja wejścia przed użyciem w queries

**Przykład walidacji:**
```typescript
const result = taskQuerySchema.safeParse(rawQueryParams);

if (!result.success) {
  return new Response(
    JSON.stringify({
      error: 'Invalid query parameters',
      details: result.error.flatten().fieldErrors
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Rate Limiting

**Rekomendacja:** Implementacja rate limiting w middleware:
- Limit: 100 requests / minute / user dla GET endpoints
- Wykorzystanie Supabase Edge Functions lub zewnętrznego serwisu (np. Upstash Redis)
- Response 429 Too Many Requests przy przekroczeniu

### Content Security Policy (CSP)

**Headers do dodania:**
```typescript
{
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}
```

### Logging i Audyt

**Wrażliwe operacje do logowania:**
- Cross-department queries przez managerów (→ `manager_audit_logs`)
- Próby dostępu do prywatnych zadań (→ `events` table)
- Błędy autoryzacji (→ application logs)

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

#### 1. Brak autoryzacji (401 Unauthorized)

**Przyczyna:**
- Brak tokenu/sesji
- Token wygasły
- Nieprawidłowy token

**Obsługa:**
```typescript
if (!locals.user) {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Valid authentication required'
    }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**Logging:** INFO level, bez szczegółów użytkownika

#### 2. Nieprawidłowe parametry zapytania (400 Bad Request)

**Przyczyna:**
- Nieprawidłowy format UUID
- Nieprawidłowa wartość enum
- Nieprawidłowy typ danych

**Obsługa:**
```typescript
const validation = taskQuerySchema.safeParse(queryParams);

if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: 'Invalid query parameters',
      details: validation.error.flatten().fieldErrors
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**Logging:** WARN level z parametrami (bez sensitive data)

#### 3. Błąd bazy danych (500 Internal Server Error)

**Przyczyna:**
- Błąd połączenia z Supabase
- Timeout zapytania
- Nieprawidłowe RLS policies
- Błąd w logice ETA calculation

**Obsługa:**
```typescript
try {
  const tasks = await taskService.listTasks(userId, userRole, filters);
  return new Response(JSON.stringify(tasks), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} catch (error) {
  console.error('Error fetching tasks:', error);
  
  // Log do systemu monitoringu (np. Sentry)
  // logError(error, { userId, filters });
  
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**Logging:** ERROR level z pełnym stack trace

#### 4. Brak wyników (200 OK z pustą tablicą)

**Przyczyna:**
- Brak zadań spełniających kryteria
- RLS policies wykluczyły wszystkie wyniki
- Użytkownik nie ma dostępu do żadnych zadań

**Obsługa:**
```typescript
// To NIE jest błąd - zwracamy pustą tablicę
return new Response(JSON.stringify([]), {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
});
```

**Logging:** DEBUG level (opcjonalnie)

### Struktura błędów

**Standard error response:**
```typescript
interface ErrorResponse {
  error: string;           // Krótki opis typu błędu
  message: string;         // Human-readable message
  details?: Record<string, string[]>; // Opcjonalne szczegóły walidacji
  code?: string;           // Opcjonalny kod błędu aplikacji
}
```

### Error Handling Utilities

**Utworzenie utility function:**
```typescript
// src/lib/utils/error-handler.ts
export function handleApiError(error: unknown): Response {
  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify({
        error: 'Validation error',
        details: error.flatten().fieldErrors
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (error instanceof PostgrestError) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({
        error: 'Database error',
        message: 'Failed to fetch tasks'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Kalkulacja ETA dla wielu zadań
**Problem:** N+1 query problem - osobne zapytanie do `plan_slots` dla każdego zadania

**Rozwiązanie:**
- Batch query: pobranie wszystkich plan_slots dla wszystkich task_ids w jednym zapytaniu
- Grupowanie po task_id w pamięci
- Cache wyników w ramach requestu

```typescript
async function batchCalculateETA(taskIds: string[]): Promise<Map<string, string | null>> {
  const { data: slots } = await supabase
    .from('plan_slots')
    .select('task_id, period')
    .in('task_id', taskIds);
    
  const etaMap = new Map<string, string | null>();
  
  // Grupowanie i obliczenia...
  
  return etaMap;
}
```

**Cel wydajności:** < 100ms dla batch calculation 50 zadań

#### 2. Privacy masking dla dużej liczby zadań
**Problem:** Sprawdzanie uprawnień menedżera dla każdego prywatnego zadania

**Rozwiązanie:**
- Prefetch: pobranie wszystkich `department_managers` dla użytkownika raz
- Cache w pamięci: Map<departmentId, boolean>
- Pominięcie sprawdzania dla non-private tasks

```typescript
async function prefetchManagerDepartments(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('department_managers')
    .select('department_id')
    .eq('manager_user_id', userId);
    
  return new Set(data?.map(d => d.department_id) ?? []);
}
```

**Cel wydajności:** < 50ms dla prefetch + masking 100 zadań

#### 3. RLS policies overhead
**Problem:** Złożone RLS queries mogą spowalniać zapytania

**Rozwiązanie:**
- Indeksy na kluczowych kolumnach:
  - `tasks(assigned_user_id)` WHERE `assigned_to_type = 'user'`
  - `tasks(assigned_department_id)` WHERE `assigned_to_type = 'department'`
  - `memberships(user_id, department_id)` + GiST na `period`
  - `department_managers(manager_user_id, department_id)`
- Partial indexes dla często filtrowanych statusów:
  - `tasks(status)` WHERE `status IN ('todo', 'in_progress')`

**Cel wydajności:** < 200ms dla query z RLS

#### 4. Duża liczba wyników
**Problem:** Zwracanie tysięcy zadań obciąża transfer i rendering

**Rozwiązanie (future enhancement):**
- Paginacja: `?limit=50&offset=0`
- Default limit: 100 zadań
- Response headers: `X-Total-Count`, `Link` (RFC 5988)
- Cursor-based pagination dla lepszej wydajności

```typescript
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const limit = Math.min(parseInt(queryParams.limit) || DEFAULT_LIMIT, MAX_LIMIT);
const offset = parseInt(queryParams.offset) || 0;

query = query.range(offset, offset + limit - 1);
```

**Cel wydajności:** < 500ms dla 100 zadań end-to-end

### Strategie optymalizacji

#### Database Query Optimization

**1. Selective fields:**
```typescript
// Zamiast SELECT *
.select('id, title, description, priority, status, estimate_minutes, ...')
```

**2. Index hints (PostgreSQL):**
```sql
-- W migrations
CREATE INDEX CONCURRENTLY idx_tasks_assigned_user_active 
  ON tasks(assigned_user_id, status) 
  WHERE assigned_to_type = 'user' AND status IN ('todo', 'in_progress');
```

**3. Query plan analysis:**
```sql
EXPLAIN ANALYZE 
SELECT * FROM tasks 
WHERE assigned_user_id = '...' AND status = 'todo';
```

#### Caching Strategy

**Application-level cache (future):**
- Redis/Upstash dla często odpytywanych list zadań
- Cache key: `tasks:${userId}:${filters_hash}`
- TTL: 60 seconds
- Invalidacja: przy POST/PATCH/DELETE na tasks

**Browser cache:**
- `Cache-Control: private, max-age=30` dla GET /api/tasks
- ETag support dla conditional requests

#### Monitoring

**Metryki do śledzenia:**
- Response time (p50, p90, p99)
- Query duration per component (DB, ETA calc, privacy mask)
- Error rate (4xx, 5xx)
- Cache hit rate (jeśli implementowany)

**Tools:**
- Supabase Dashboard (query performance)
- Application logs (structured JSON)
- APM tool (np. Sentry Performance)

**Alert thresholds:**
- p90 > 2000ms (zgodnie z PRD dla widoku planu)
- Error rate > 1%
- DB connection pool exhaustion

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury

#### 1.1. Utworzenie struktury folderów i plików
```bash
src/
├── lib/
│   ├── services/
│   │   ├── task.service.ts          # Nowy
│   │   └── auth.service.ts          # Nowy (jeśli nie istnieje)
│   ├── schemas/
│   │   └── task.schema.ts           # Nowy
│   └── utils/
│       ├── error-handler.ts         # Nowy
│       └── eta-calculator.ts        # Nowy
└── pages/
    └── api/
        └── tasks/
            └── index.ts             # Nowy endpoint
```

#### 1.2. Weryfikacja middleware
- [ ] Sprawdzić, czy `src/middleware/index.ts` weryfikuje sesję Supabase
- [ ] Upewnić się, że `locals.user` zawiera `id` i `app_role`
- [ ] Jeśli nie istnieje, zaimplementować zgodnie z Astro guidelines

#### 1.3. Weryfikacja typów bazy danych
- [ ] Sprawdzić, czy `src/db/database.types.ts` jest aktualny
- [ ] Uruchomić `supabase gen types typescript` jeśli potrzeba
- [ ] Zweryfikować typy: `tasks`, `plan_slots`, `memberships`, `department_managers`

### Faza 2: Implementacja warstwy walidacji

#### 2.1. Utworzenie Zod schemas
```typescript
// src/lib/schemas/task.schema.ts
import { z } from 'zod';

export const taskQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  department_id: z.string().uuid().optional(),
  assigned_to_user_id: z.string().uuid().optional(),
  is_private: z.coerce.boolean().optional()
});

export type TaskQueryParams = z.infer<typeof taskQuerySchema>;
```

#### 2.2. Utworzenie error handler utility
```typescript
// src/lib/utils/error-handler.ts
import { ZodError } from 'zod';
import { PostgrestError } from '@supabase/supabase-js';

export function handleApiError(error: unknown): Response {
  // Implementacja zgodnie z sekcją 7
}
```

### Faza 3: Implementacja service layer

#### 3.1. Auth Service (helper functions)
```typescript
// src/lib/services/auth.service.ts
import { createClient } from '@/db/supabase.client';
import type { Database } from '@/db/database.types';

export async function getCurrentUserRole(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('app_role')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data.app_role;
}

export async function getManagerDepartments(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('department_managers')
    .select('department_id')
    .eq('manager_user_id', userId);
    
  return new Set(data?.map(d => d.department_id) ?? []);
}

export async function getUserDepartment(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('memberships')
    .select('department_id')
    .eq('user_id', userId)
    .contains('period', new Date().toISOString())
    .single();
    
  return data?.department_id ?? null;
}
```

#### 3.2. ETA Calculator
```typescript
// src/lib/utils/eta-calculator.ts
import { createClient } from '@/db/supabase.client';

export async function batchCalculateETA(
  taskIds: string[]
): Promise<Map<string, string | null>> {
  if (taskIds.length === 0) return new Map();
  
  const supabase = createClient();
  const { data: slots, error } = await supabase
    .from('plan_slots')
    .select('task_id, period')
    .in('task_id', taskIds)
    .order('period', { ascending: false });
    
  if (error) throw error;
  
  const etaMap = new Map<string, string | null>();
  const slotsByTask = new Map<string, any[]>();
  
  // Grupowanie slotów po task_id
  slots?.forEach(slot => {
    if (!slotsByTask.has(slot.task_id)) {
      slotsByTask.set(slot.task_id, []);
    }
    slotsByTask.get(slot.task_id)!.push(slot);
  });
  
  // Kalkulacja ETA dla każdego zadania
  for (const taskId of taskIds) {
    const taskSlots = slotsByTask.get(taskId) || [];
    
    if (taskSlots.length === 0) {
      etaMap.set(taskId, null);
      continue;
    }
    
    // Najnowszy slot (pierwszy po sortowaniu DESC)
    const latestSlot = taskSlots[0];
    // Wyodrębnienie górnej granicy tstzrange
    const periodMatch = latestSlot.period.match(/,\s*"([^"]+)"\)/);
    const eta = periodMatch ? periodMatch[1] : null;
    
    etaMap.set(taskId, eta);
  }
  
  return etaMap;
}
```

**Uwaga:** Pełna implementacja ETA powinna uwzględniać sumowanie długości slotów i porównanie z `estimate_minutes`. Powyższy kod uproszczony - do rozszerzenia.

#### 3.3. Task Service (główna logika)
```typescript
// src/lib/services/task.service.ts
import { createClient } from '@/db/supabase.client';
import type { Database } from '@/db/database.types';
import type { TaskDTO, TaskQueryParams } from '@/types';
import { batchCalculateETA } from '@/lib/utils/eta-calculator';
import { getManagerDepartments, getUserDepartment } from './auth.service';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

export async function listTasks(
  userId: string,
  userRole: string,
  filters: TaskQueryParams
): Promise<TaskDTO[]> {
  const supabase = createClient();
  
  // Budowanie query z filtrami
  let query = supabase
    .from('tasks')
    .select('*');
  
  // Aplikacja filtrów
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }
  
  if (filters.department_id) {
    query = query.eq('assigned_department_id', filters.department_id);
  }
  
  if (filters.assigned_to_user_id) {
    query = query.eq('assigned_user_id', filters.assigned_to_user_id);
  }
  
  if (filters.is_private !== undefined) {
    query = query.eq('is_private', filters.is_private);
  }
  
  // Wykonanie zapytania (RLS automatycznie filtruje)
  const { data: tasks, error } = await query;
  
  if (error) throw error;
  if (!tasks || tasks.length === 0) return [];
  
  // Batch calculation ETA
  const taskIds = tasks.map(t => t.id);
  const etaMap = await batchCalculateETA(taskIds);
  
  // Prefetch manager departments dla privacy masking
  const managerDepartments = userRole === 'manager' || userRole === 'admin'
    ? await getManagerDepartments(userId)
    : new Set<string>();
  
  const userDepartment = userRole === 'employee'
    ? await getUserDepartment(userId)
    : null;
  
  // Mapowanie do DTO z privacy masking
  const taskDTOs: TaskDTO[] = tasks.map(task => {
    const eta = etaMap.get(task.id) ?? null;
    
    // Privacy masking
    let description = task.description;
    if (task.is_private) {
      const isOwner = task.assigned_user_id === userId;
      const isAdmin = userRole === 'admin';
      const isManagerOfTask = task.assigned_department_id 
        ? managerDepartments.has(task.assigned_department_id)
        : false;
      
      if (!isOwner && !isAdmin && !isManagerOfTask) {
        description = null;
      }
    }
    
    return {
      id: task.id,
      title: task.title,
      description,
      priority: task.priority,
      status: task.status,
      estimate_minutes: task.estimate_minutes,
      due_date: task.due_date,
      assigned_to_type: task.assigned_to_type,
      assigned_user_id: task.assigned_user_id,
      assigned_department_id: task.assigned_department_id,
      assigned_by_user_id: task.assigned_by_user_id,
      created_by_user_id: task.created_by_user_id,
      is_private: task.is_private,
      eta
    };
  });
  
  return taskDTOs;
}
```

### Faza 4: Implementacja endpoint handler

#### 4.1. Utworzenie pliku endpoint
```typescript
// src/pages/api/tasks/index.ts
import type { APIRoute } from 'astro';
import { taskQuerySchema } from '@/lib/schemas/task.schema';
import { listTasks } from '@/lib/services/task.service';
import { handleApiError } from '@/lib/utils/error-handler';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  // 1. Weryfikacja autoryzacji (middleware powinno to załatwić)
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication required'
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  try {
    // 2. Parsowanie i walidacja query parameters
    const searchParams = url.searchParams;
    const rawParams = {
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      department_id: searchParams.get('department_id') ?? undefined,
      assigned_to_user_id: searchParams.get('assigned_to_user_id') ?? undefined,
      is_private: searchParams.get('is_private') ?? undefined
    };
    
    const validation = taskQuerySchema.safeParse(rawParams);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid query parameters',
          details: validation.error.flatten().fieldErrors
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 3. Wywołanie service layer
    const tasks = await listTasks(
      locals.user.id,
      locals.user.app_role,
      validation.data
    );
    
    // 4. Zwrot odpowiedzi
    return new Response(
      JSON.stringify(tasks),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=30'
        }
      }
    );
    
  } catch (error) {
    // 5. Obsługa błędów
    return handleApiError(error);
  }
};
```

### Faza 5: Testowanie

#### 5.1. Unit tests (opcjonalne, ale zalecane)
```typescript
// tests/unit/task.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { listTasks } from '@/lib/services/task.service';

describe('Task Service', () => {
  it('should return tasks for authenticated user', async () => {
    const tasks = await listTasks('user-id', 'employee', {});
    expect(Array.isArray(tasks)).toBe(true);
  });
  
  it('should mask description for private tasks', async () => {
    const tasks = await listTasks('other-user-id', 'employee', {});
    const privateTask = tasks.find(t => t.is_private);
    expect(privateTask?.description).toBeNull();
  });
  
  // Więcej testów...
});
```

#### 5.2. Integration tests
- [ ] Test RLS policies: czy employee widzi tylko swoje zadania
- [ ] Test RLS policies: czy manager widzi zadania swojego działu
- [ ] Test RLS policies: czy admin widzi wszystkie zadania
- [ ] Test privacy masking: czy opis jest maskowany poprawnie
- [ ] Test ETA calculation: czy ETA jest obliczane poprawnie
- [ ] Test filters: czy filtrowanie działa dla każdego parametru

#### 5.3. Manual testing
```bash
# Lokalne środowisko
npm run dev

# Test requests
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4321/api/tasks?status=todo"

curl -H "Authorization: Bearer <token>" \
  "http://localhost:4321/api/tasks?priority=high&department_id=<uuid>"

curl -H "Authorization: Bearer <token>" \
  "http://localhost:4321/api/tasks?is_private=true"
```

#### 5.4. Performance testing
```bash
# Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
  "http://localhost:4321/api/tasks"

# Verify p90 < 2000ms
# Check database query performance in Supabase dashboard
```

### Faza 6: Deployment i monitoring

#### 6.1. Database migrations (jeśli potrzeba)
```sql
-- migrations/create_task_indexes.sql

-- Indeksy dla performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_user_status 
  ON tasks(assigned_user_id, status) 
  WHERE assigned_to_type = 'user' AND status IN ('todo', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_dept 
  ON tasks(assigned_department_id) 
  WHERE assigned_to_type = 'department';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plan_slots_task_period 
  ON plan_slots(task_id, period DESC);
```

#### 6.2. RLS policies deployment
```sql
-- migrations/tasks_rls_policies.sql

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Polityki zgodnie z sekcją 6
CREATE POLICY "admin_all_tasks" ON tasks FOR SELECT TO authenticated USING (...);
CREATE POLICY "manager_department_tasks" ON tasks FOR SELECT TO authenticated USING (...);
CREATE POLICY "employee_own_tasks" ON tasks FOR SELECT TO authenticated USING (...);
```

#### 6.3. Environment variables
```bash
# .env.production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### 6.4. Deployment
```bash
# Build
npm run build

# Deploy (Digital Ocean / Vercel / Supabase Functions)
# Zgodnie z CI/CD pipeline projektu
```

#### 6.5. Monitoring setup
- [ ] Skonfigurować Sentry (error tracking)
- [ ] Skonfigurować Supabase Dashboard alerts
- [ ] Ustawić alerty dla p90 > 2000ms
- [ ] Ustawić alerty dla error rate > 1%
- [ ] Monitorować użycie database connections

#### 6.6. Documentation
- [ ] Dodać endpoint do API documentation
- [ ] Zaktualizować CHANGELOG
- [ ] Dodać przykłady użycia w README
- [ ] Udokumentować error codes dla zespołu frontend

### Checklist końcowy

#### Przed merge do main:
- [ ] Wszystkie testy unit przechodzą
- [ ] Wszystkie testy integration przechodzą
- [ ] Performance tests: p90 < 2000ms
- [ ] Linter passes (ESLint, TypeScript)
- [ ] Code review approved
- [ ] RLS policies przetestowane ręcznie dla każdej roli
- [ ] Privacy masking zweryfikowany ręcznie
- [ ] Error handling przetestowany dla wszystkich scenariuszy
- [ ] Documentation zaktualizowana
- [ ] Environment variables ustawione na production

#### Post-deployment:
- [ ] Smoke tests na production
- [ ] Monitoring dashboard zweryfikowany
- [ ] Alerty działają poprawnie
- [ ] Performance metrics w normie
- [ ] Error rate < 1%
- [ ] Komunikacja z zespołem frontend o dostępności endpointa

---

## Podsumowanie

Ten plan implementacji zapewnia kompleksowe wdrożenie endpointa `GET /api/tasks` zgodnie z:
- **Specyfikacją API** z `.ai/api-plan.md`
- **Schematem bazy danych** z `.ai/db-plan.md`
- **Tech stackiem** (Astro 5, TypeScript 5, Supabase)
- **Best practices** bezpieczeństwa i wydajności

Kluczowe aspekty implementacji:
1. **Security-first:** RLS policies, authentication, privacy masking
2. **Performance-optimized:** Batch queries, caching, indexing
3. **Type-safe:** Zod validation, TypeScript everywhere
4. **Maintainable:** Service layer separation, error handling, logging
5. **Testable:** Unit tests, integration tests, performance tests

Przy przestrzeganiu tego planu, endpoint będzie spełniał wymagania PRD (p90 < 2s) oraz zapewni bezpieczny, skalowalny dostęp do danych zadań z odpowiednimi mechanizmami autoryzacji i maskowania prywatności.

