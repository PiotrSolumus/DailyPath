# Plan implementacji widoku Zadania (Tasks)

## 1. Przegląd

Widok Zadania (Tasks) to główny interfejs do przeglądania, filtrowania i zarządzania zadaniami w aplikacji DailyPath. Umożliwia użytkownikom wyświetlanie listy zadań przypisanych do nich lub ich działu, z uwzględnieniem hierarchii uprawnień (employee/manager/admin) i ochrony prywatności. Widok wspiera filtrowanie po statusie, priorytecie, dziale, przypisaniu oraz widoczności (publiczne/prywatne).

**Główne cele widoku:**
- Wyświetlanie listy zadań zgodnie z uprawnieniami użytkownika (RLS)
- Filtrowanie zadań po wielu kryteriach z synchronizacją URL
- Tworzenie nowych zadań przez formularz modalny
- Maskowanie opisów zadań prywatnych dla nieuprzywilejowanych użytkowników
- Wyświetlanie dynamicznie obliczanego ETA na podstawie zaplanowanych slotów
- Obsługa różnych ról użytkowników (employee, manager, admin)

## 2. Routing widoku

**Ścieżka:** `/tasks`

**Plik Astro:** `src/pages/tasks.astro`

**Parametry URL (query strings):**
- `status` - filtrowanie po statusie zadania (todo, in_progress, blocked, done)
- `priority` - filtrowanie po priorytecie (low, medium, high)
- `department_id` - filtrowanie po dziale (UUID)
- `assigned_to_user_id` - filtrowanie po użytkowniku (UUID)
- `is_private` - filtrowanie po prywatności (true, false)

**Przykładowe URL:**
- `/tasks` - wszystkie dostępne zadania
- `/tasks?status=todo&priority=high` - zadania do zrobienia o wysokim priorytecie
- `/tasks?is_private=true` - tylko zadania prywatne
- `/tasks?department_id=550e8400-e29b-41d4-a716-446655440000` - zadania konkretnego działu

## 3. Struktura komponentów

```
tasks.astro (strona Astro)
├── AppLayout (layout)
│   └── PageHeader (React)
│       ├── title: "Zadania"
│       ├── description: "Zarządzaj swoimi zadaniami"
│       └── actions: Button "Nowe zadanie"
├── TaskFilters (React)
│   ├── StatusFilter (Select)
│   ├── PriorityFilter (Select)
│   ├── VisibilityFilter (Select)
│   ├── SearchInput (Input)
│   └── ClearFiltersButton (Button)
├── TaskList (React)
│   ├── LoadingState (Spinner)
│   ├── ErrorState (Alert)
│   ├── EmptyState (EmptyMessage)
│   └── TaskCard[] (array of cards)
│       ├── CardHeader
│       │   ├── title
│       │   ├── PriorityBadge
│       │   ├── StatusBadge
│       │   └── PrivateTaskBadge (conditional)
│       ├── CardContent
│       │   ├── description (or masked)
│       │   ├── estimate display
│       │   ├── due_date display (conditional)
│       │   ├── eta display (conditional)
│       │   └── assigned_by display (conditional)
│       └── CardFooter (future: quick actions)
└── CreateTaskModal (React - future)
    └── CreateTaskForm (React)
```

## 4. Szczegóły komponentów

### 4.1 TaskList

**Opis:** Główny komponent odpowiedzialny za pobieranie i wyświetlanie listy zadań. Wykorzystuje React Query do zarządzania stanem asynchronicznym i cache'owaniem danych. Wyświetla różne stany: ładowanie, błąd, pusta lista, lista zadań.

**Główne elementy:**
- `div.flex.items-center.justify-center.py-12` - kontener stanu ładowania z komponentem Spinner
- `div.rounded-lg.border.border-red-200.bg-red-50` - kontener stanu błędu z komunikatem
- `div.rounded-lg.border.bg-muted.p-12` - kontener pustej listy z informacją
- `div.grid.gap-4.sm:grid-cols-2.lg:grid-cols-3` - siatka kart zadań (responsywna)
- Komponenty dzieci: `TaskCard` (mapowane z tablicy tasks)

**Obsługiwane zdarzenia:**
- `onTaskClick?: (task: TaskDTO) => void` - kliknięcie w kartę zadania (przekazywane z props)
- React Query automatyczne: refetch on window focus, retry on error

**Obsługiwana walidacja:**
- Walidacja odpowiedzi API (czy dane są tablicą TaskDTO[])
- Sprawdzanie statusu HTTP response (response.ok)

**Typy:**
- `TaskDTO` - typ pojedynczego zadania z API (zawiera dynamiczne ETA)
- `TaskListProps` - interfejs propsów komponentu

**Propsy:**
```typescript
interface TaskListProps {
  filters?: Record<string, string | undefined>; // Filtry z URL
  onTaskClick?: (task: TaskDTO) => void; // Handler kliknięcia w zadanie
}
```

**Logika pobierania danych:**
- `fetchTasks(filters)` - async function budująca URL z parametrami i wywołująca fetch
- `useQuery` z queryKey `["tasks", filters]` - automatyczne cache'owanie i refetch przy zmianie filtrów

**Stany komponentu:**
- `isLoading` - ładowanie danych
- `error` - błąd pobierania
- `tasks` - tablica pobranych zadań

### 4.2 TaskCard

**Opis:** Komponent prezentacyjny wyświetlający pojedyncze zadanie w formie karty. Wyświetla tytuł, opis (z maskowaniem dla zadań prywatnych), priorytetet, status, estymację, datę docelową, ETA oraz informację o autorze przypisania. Karta jest interaktywna - klikalna i dostępna z klawiatury.

**Główne elementy:**
- `Card` (shadcn/ui) - kontener karty z efektem hover i cursor pointer
  - `CardHeader` - nagłówek z tytułem i badges
    - `CardTitle` - tytuł zadania
    - `div.flex.flex-wrap.gap-2` - kontener na badges
      - `PriorityBadge` - badge priorytetu
      - `StatusBadge` - badge statusu
      - `PrivateTaskBadge` (warunkowy) - badge zadania prywatnego
    - `CardDescription` - opis zadania lub "[Szczegóły prywatne]"
  - `CardContent` - treść z detalami
    - `dl.grid.gap-2.text-sm` - lista definicji
      - `div` z ikoną Clock - estymacja w godzinach i minutach
      - `div` z ikoną Calendar - data docelowa (warunkowe)
      - `div` z ikoną Calendar - ETA (warunkowe, zielony tekst)
      - `div` z ikoną User - przypisane przez (warunkowe)

**Obsługiwane zdarzenia:**
- `onClick` - obsługa kliknięcia myszą w kartę
- `onKeyDown` - obsługa Enter i Space dla dostępności klawiatury
- Przekazywane do parent component przez callback `onClick`

**Obsługiwana walidacja:**
- Walidacja istnienia `task.description` przed wyświetleniem
- Walidacja warunku prywatności (`task.is_private && task.description === null`)
- Walidacja istnienia `task.due_date` przed wyświetleniem
- Walidacja istnienia `task.eta` przed wyświetleniem
- Walidacja prop `showAssignedBy` przed wyświetleniem autora

**Typy:**
- `TaskDTO` - główny typ zadania
- `TaskCardProps` - interfejs propsów

**Propsy:**
```typescript
interface TaskCardProps {
  task: TaskDTO; // Dane zadania do wyświetlenia
  onClick?: () => void; // Handler kliknięcia w kartę
  showAssignedBy?: boolean; // Czy pokazywać autora przypisania (domyślnie true)
}
```

**Formatowanie danych:**
- Konwersja minut estymacji na format "Xh Ymin"
- Formatowanie dat z `date-fns` i polską lokalizacją
- `format(parseISO(date), pattern, { locale: pl })`

**Accessibility:**
- `role="button"` - semantyczna rola dla karty interaktywnej
- `tabIndex={0}` - możliwość nawigacji klawiaturą
- `sr-only` dla labelek `<dt>` - dostępne dla screen readers
- Obsługa Enter i Space dla aktywacji

### 4.3 TaskFilters

**Opis:** Komponent filtrowania zadań z automatyczną synchronizacją z URL (query parameters). Używa biblioteki `nuqs` do zarządzania stanem w URL. Wyświetla filtry: status, priorytet, widoczność, wyszukiwanie (placeholder na przyszłość). Zawiera przycisk czyszczenia wszystkich filtrów.

**Główne elementy:**
- `NuqsAdapter` - adapter dla nuqs w kontekście React z Astro
- `div.space-y-4.rounded-lg.border.bg-card.p-4` - kontener filtrów
  - `div.flex.items-center.justify-between` - nagłówek z tytułem i przyciskiem czyszczenia
    - `h3.font-medium` - tytuł "Filtry"
    - `Button` "Wyczyść" (warunkowy - gdy są aktywne filtry)
  - `div.grid.gap-4.sm:grid-cols-2.lg:grid-cols-4` - siatka inputów filtrów
    - Status `Select` - dropdown z opcjami statusów
    - Priority `Select` - dropdown z opcjami priorytetów
    - Visibility `Select` - dropdown z opcjami publiczne/prywatne
    - Search `Input` - pole tekstowe wyszukiwania (placeholder)

**Obsługiwane zdarzenia:**
- `onChange` na każdym Select - aktualizacja odpowiedniego filtra w URL
- `onClick` na Button "Wyczyść" - wywołanie `clearFilters()`
- Wszystkie zmiany filtrów automatycznie triggeru ją refetch w TaskList (przez zmianę queryKey)

**Obsługiwana walidacja:**
- Walidacja wartości select (tylko dozwolone enum values)
- Konwersja string "true"/"false" na boolean dla `is_private`
- Obsługa pustej wartości select jako null (usunięcie filtra)

**Typy:**
- `useTaskFilters` return type (z custom hook)

**Propsy:**
Brak propsów - komponent zarządza własnym stanem przez custom hook.

**Custom hook:** `useTaskFilters()` z `src/lib/utils/query-params.ts`
```typescript
{
  filters: {
    status?: string;
    priority?: string;
    department_id?: string;
    user_id?: string;
    is_private?: boolean;
  };
  setStatus: (value: string | null) => void;
  setPriority: (value: string | null) => void;
  setDepartmentId: (value: string | null) => void;
  setUserId: (value: string | null) => void;
  setIsPrivate: (value: boolean | null) => void;
  clearFilters: () => void;
}
```

**Warunkowe wyświetlanie:**
- Przycisk "Wyczyść" widoczny tylko gdy: `Object.values(filters).some((v) => v !== undefined)`

### 4.4 CreateTaskForm

**Opis:** Formularz tworzenia nowego zadania z walidacją i obsługą błędów. Używa React Query mutations do wysyłania danych do API. Wyświetla powiadomienia toast przy sukcesie/błędzie. Zawiera pola: tytuł, opis, priorytet, estymację, datę docelową, checkbox prywatności.

**Główne elementy:**
- `Card` (shadcn/ui) - kontener formularza
  - `form` z onSubmit handler
    - `CardHeader` - nagłówek "Nowe zadanie"
    - `CardContent` - treść z polami formularza
      - `Input` - tytuł (required)
      - `textarea` - opis (opcjonalny)
      - `Select` - priorytet (required, domyślnie "medium")
      - `Input[type=number]` - estymacja w minutach (required, min=15, step=15)
      - `Input[type=date]` - data docelowa (opcjonalna)
      - `checkbox` - czy zadanie prywatne (domyślnie false)
    - `CardFooter` - stopka z przyciskami
      - `Button[type=button]` "Anuluj" (warunkowy, gdy jest onCancel)
      - `Button[type=submit]` "Utwórz zadanie" (disabled podczas mutacji)

**Obsługiwane zdarzenia:**
- `onSubmit` - wysłanie formularza, wywołanie mutation
- `onChange` na każdym input/select - aktualizacja `formData` state
- `onClick` na Button "Anuluj" - wywołanie callback `onCancel`
- `onSuccess` mutation - invalidacja query cache ["tasks"], toast success, callback `onSuccess`
- `onError` mutation - toast error z przyjaznym komunikatem

**Obsługiwana walidacja:**

**Walidacja HTML5 (native):**
- `title` - required (nie może być pusty)
- `priority` - required (musi wybrać z enum)
- `estimate_minutes` - required, type="number", min="15", step="15"

**Walidacja API (backend - Zod schema):**
- `title` - string, minLength: 1, maxLength: 255
- `description` - string, optional, maxLength: 2000
- `priority` - enum: "low" | "medium" | "high"
- `estimate_minutes` - number, min: 15, multipleOf: 15
- `due_date` - ISO date string lub null
- `is_private` - boolean
- `assigned_to_type` - enum (domyślnie "user" w MVP)

**Typy:**
- `CreateTaskCommand` - typ payload dla POST /api/tasks
- `CreateTaskFormProps` - interfejs propsów

**Propsy:**
```typescript
interface CreateTaskFormProps {
  onSuccess?: () => void; // Callback po udanym utworzeniu
  onCancel?: () => void; // Callback anulowania (zamknięcie modalu)
}
```

**State management:**
- `formData: CreateTaskCommand` - lokalny state formularza
- `useMutation` - React Query mutation z funkcją `createTask`

**Domyślne wartości formularza:**
```typescript
{
  title: "",
  description: "",
  priority: "medium",
  estimate_minutes: 60,
  assigned_to_type: "user",
  is_private: false,
  due_date: null,
}
```

### 4.5 PageHeader

**Opis:** Komponent nagłówka strony z tytułem, opisem i akcjami (przyciskami). Wykorzystywany na wszystkich głównych widokach aplikacji. W widoku Tasks zawiera przycisk "Nowe zadanie".

**Główne elementy:**
- `header` - kontener semantyczny
  - `div.flex.items-center.justify-between` - flex layout
    - `div` - lewa strona z tekstami
      - `h1` - tytuł strony
      - `p` - opis strony (opcjonalny)
    - `div` - prawa strona z akcjami (slot dla przycisków)

**Obsługiwane zdarzenia:**
- Przekazywane przez slot `actions` (np. onClick na Button)

**Propsy:**
```typescript
interface PageHeaderProps {
  title: string; // Tytuł strony
  description?: string; // Opcjonalny opis
  actions?: React.ReactNode; // Slot na przyciski akcji
}
```

### 4.6 Badge Components (PriorityBadge, StatusBadge, PrivateTaskBadge)

**Opis:** Małe komponenty prezentacyjne wyświetlające badges z odpowiednim kolorem i tekstem.

**PriorityBadge:**
- Props: `priority: Enums<"task_priority">`
- Mapowanie: low → "Niski" (info), medium → "Średni" (warning), high → "Wysoki" (destructive)

**StatusBadge:**
- Props: `status: Enums<"task_status">`
- Mapowanie: todo → "Do zrobienia" (outline), in_progress → "W trakcie" (info), blocked → "Zablokowane" (warning), done → "Zakończone" (success)

**PrivateTaskBadge:**
- Brak props
- Wyświetla: "Prywatne" z odpowiednią ikoną

## 5. Typy

### 5.1 Istniejące typy z src/types.ts

```typescript
/**
 * TaskDTO - główny typ zadania zwracany z API GET /api/tasks
 * Zawiera wszystkie pola z tabeli tasks + dynamiczne ETA
 */
export interface TaskDTO extends Omit<Tables<"tasks">, "created_at" | "updated_at"> {
  id: string; // UUID
  title: string; // Nazwa zadania
  description: string | null; // Opis (null dla prywatnych gdy brak uprawnień)
  priority: Enums<"task_priority">; // "low" | "medium" | "high"
  status: Enums<"task_status">; // "todo" | "in_progress" | "blocked" | "done"
  estimate_minutes: number; // Estymacja w minutach
  due_date: string | null; // ISO date string lub null
  assigned_to_type: Enums<"assigned_to_type">; // "user" | "department"
  assigned_user_id: string | null; // UUID użytkownika lub null
  assigned_department_id: string | null; // UUID działu lub null
  assigned_by_user_id: string | null; // UUID autora przypisania
  created_by_user_id: string; // UUID twórcy
  is_private: boolean; // Czy zadanie prywatne
  eta: string | null; // Dynamicznie obliczane ETA (ISO datetime) lub null
}

/**
 * CreateTaskCommand - payload dla POST /api/tasks
 */
export interface CreateTaskCommand
  extends Pick<
    TablesInsert<"tasks">,
    "title" | "description" | "priority" | "estimate_minutes" | "assigned_to_type" | "is_private" | "due_date"
  > {
  assigned_id?: string; // UUID - mapuje na assigned_user_id lub assigned_department_id
}
```

### 5.2 Typy propsów komponentów

```typescript
/**
 * TaskListProps - propsy komponentu TaskList
 */
interface TaskListProps {
  filters?: Record<string, string | undefined>; // Filtry URL
  onTaskClick?: (task: TaskDTO) => void; // Callback kliknięcia
}

/**
 * TaskCardProps - propsy komponentu TaskCard
 */
interface TaskCardProps {
  task: TaskDTO; // Dane zadania
  onClick?: () => void; // Callback kliknięcia
  showAssignedBy?: boolean; // Czy pokazywać autora (domyślnie true)
}

/**
 * CreateTaskFormProps - propsy komponentu CreateTaskForm
 */
interface CreateTaskFormProps {
  onSuccess?: () => void; // Callback sukcesu
  onCancel?: () => void; // Callback anulowania
}

/**
 * PageHeaderProps - propsy komponentu PageHeader
 */
interface PageHeaderProps {
  title: string; // Tytuł strony
  description?: string; // Opcjonalny opis
  actions?: React.ReactNode; // Slot na akcje
}
```

### 5.3 Typy pomocnicze z custom hooks

```typescript
/**
 * TaskFiltersState - return type z useTaskFilters
 */
interface TaskFiltersState {
  filters: {
    status?: string;
    priority?: string;
    department_id?: string;
    assigned_to_user_id?: string;
    is_private?: boolean;
  };
  setStatus: (value: string | null) => void;
  setPriority: (value: string | null) => void;
  setDepartmentId: (value: string | null) => void;
  setUserId: (value: string | null) => void;
  setIsPrivate: (value: boolean | null) => void;
  clearFilters: () => void;
}
```

### 5.4 Typy z bazy danych (Supabase generated)

```typescript
// Z src/db/database.types.ts
Enums<"task_priority"> = "low" | "medium" | "high"
Enums<"task_status"> = "todo" | "in_progress" | "blocked" | "done"
Enums<"assigned_to_type"> = "user" | "department"
Enums<"app_role"> = "admin" | "manager" | "employee"

Tables<"tasks"> // Pełny typ wiersza z tabeli tasks
TablesInsert<"tasks"> // Typ dla INSERT operations
TablesUpdate<"tasks"> // Typ dla UPDATE operations
```

## 6. Zarządzanie stanem

### 6.1 Stan globalny - React Query

**Provider:** `QueryProvider` w `src/lib/contexts/QueryProvider.tsx`
- Opakowuje całą aplikację w QueryClientProvider
- Konfiguracja: stale time, cache time, retry logic
- Automatyczne refetch on window focus
- Automatic garbage collection nieużywanych queries

**Query keys:**
- `["tasks", filters]` - lista zadań z filtrami
- Automatyczna invalidacja po mutations (create, update, delete)

### 6.2 Stan URL - nuqs

**Custom hook:** `useTaskFilters()` z `src/lib/utils/query-params.ts`
- Synchronizacja filtrów z URL query parameters
- Używa `nuqs` do parseowania i update'owania URL
- Typy filtrów: `parseAsString` dla wszystkich pól
- Automatyczne triggowanie refetch w React Query przy zmianie URL

**Zalety podejścia:**
- Shareable URLs (można udostępnić link z filtrami)
- Browser history support (back/forward buttons)
- Bookmarkable filtered views
- SSR-friendly (można prefetch z URL params)

### 6.3 Stan lokalny komponentów

**TaskList:**
- Zarządzane przez React Query: `isLoading`, `error`, `data`
- Brak dodatkowego lokalnego state

**TaskCard:**
- Brak state - czysty presentation component

**TaskFilters:**
- State zarządzany przez `useTaskFilters` hook (nuqs)
- Brak dodatkowego lokalnego state

**CreateTaskForm:**
- `formData: CreateTaskCommand` - lokalny state formularza (useState)
- `mutation` - React Query mutation state (isPending, isError, etc.)

### 6.4 Custom hooks

**useTaskFilters():**
- Lokalizacja: `src/lib/utils/query-params.ts`
- Cel: Zarządzanie filtrami z synchronizacją URL
- Używany w: TaskFilters component
- Return: obiekt z filters i setterami

**Przyszłe custom hooks (do implementacji):**
- `useTaskMutations()` - zgrupowane mutations (create, update, delete)
- `useTaskDetails(taskId)` - szczegóły pojedynczego zadania
- `useTaskPermissions(task, user)` - sprawdzanie uprawnień do zadania

## 7. Integracja API

### 7.1 Endpoint: GET /api/tasks

**URL:** `/api/tasks`

**Metoda:** GET

**Query Parameters:**
- `status?: string` - filtrowanie po statusie
- `priority?: string` - filtrowanie po priorytecie
- `department_id?: string` - UUID działu
- `assigned_to_user_id?: string` - UUID użytkownika
- `is_private?: string` - "true" lub "false"

**Request Headers:**
- `Authorization: Bearer <token>` lub Cookie-based session
- `Content-Type: application/json`

**Response Type:** `TaskDTO[]`

**Response 200 OK:**
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
  }
]
```

**Response Errors:**
- `400 Bad Request` - nieprawidłowe parametry query
- `401 Unauthorized` - brak autoryzacji
- `500 Internal Server Error` - błąd serwera

**Funkcja fetch w komponencie:**
```typescript
async function fetchTasks(filters: Record<string, string | undefined>): Promise<TaskDTO[]> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value);
    }
  });
  
  const response = await fetch(`/api/tasks?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  
  return response.json();
}
```

**React Query usage:**
```typescript
const { data: tasks, isLoading, error } = useQuery({
  queryKey: ["tasks", filters],
  queryFn: () => fetchTasks(filters),
});
```

### 7.2 Endpoint: POST /api/tasks

**URL:** `/api/tasks`

**Metoda:** POST

**Request Body Type:** `CreateTaskCommand`

**Request Body:**
```json
{
  "title": "New task",
  "description": "Task description",
  "priority": "high",
  "estimate_minutes": 120,
  "assigned_to_type": "user",
  "is_private": false,
  "due_date": "2026-01-15"
}
```

**Response Type:** `TaskDTO`

**Response 201 Created:**
```json
{
  "id": "generated-uuid",
  "title": "New task",
  ...
}
```

**Response Errors:**
- `400 Bad Request` - walidacja nie powiodła się
- `401 Unauthorized` - brak autoryzacji
- `403 Forbidden` - brak uprawnień
- `500 Internal Server Error` - błąd serwera

**Funkcja mutation:**
```typescript
async function createTask(data: CreateTaskCommand): Promise<void> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Zadanie zostało utworzone");
  },
  onError: (error) => {
    toast.error(getErrorMessage(error));
  },
});
```

### 7.3 Mechanizm RLS (Row Level Security)

**Backend (Supabase):**
- Automatyczne filtrowanie wyników na poziomie bazy danych
- Polityki RLS sprawdzają uprawnienia użytkownika:
  - **Employee:** widzi własne zadania + zadania przypisane do swojego działu
  - **Manager:** widzi zadania swoich działów + zadania użytkowników w swoich działach
  - **Admin:** widzi wszystkie zadania

**Frontend:**
- Nie musi sprawdzać uprawnień - RLS robi to automatycznie
- Zadania, których użytkownik nie powinien widzieć, nie są zwracane przez API

### 7.4 Privacy Masking

**Backend logic:**
- Dla zadań `is_private = true`:
  - Właściciel (assigned_user_id) → pełny dostęp
  - Menedżer działu właściciela → pełny dostęp
  - Inni → `description = null`

**Frontend display:**
- W TaskCard sprawdzamy: `task.is_private && task.description === null`
- Jeśli prawda, wyświetlamy: "[Szczegóły prywatne]" zamiast opisu

## 8. Interakcje użytkownika

### 8.1 Przeglądanie listy zadań

**Flow:**
1. Użytkownik wchodzi na `/tasks`
2. Middleware Astro weryfikuje sesję
3. Strona renderuje się z AppLayout
4. TaskList component montuje się i wywołuje useQuery
5. API zwraca zadania zgodnie z RLS
6. Lista zadań renderuje się jako siatka kart

**Stany UI:**
- Loading: wyświetlany Spinner
- Error: wyświetlany komunikat błędu
- Empty: wyświetlany komunikat "Brak zadań"
- Success: wyświetlana siatka TaskCard

### 8.2 Filtrowanie zadań

**Flow:**
1. Użytkownik zmienia wartość w Select (np. status → "todo")
2. `onChange` handler wywołuje `setStatus("todo")`
3. nuqs aktualizuje URL: `/tasks?status=todo`
4. React Query wykrywa zmianę queryKey `["tasks", filters]`
5. Automatyczny refetch z nowymi parametrami
6. Lista się re-renderuje z przefiltrowanymi zadaniami

**Synchronizacja:**
- URL jest source of truth dla filtrów
- Odświeżenie strony zachowuje filtry
- Browser back/forward działa poprawnie

### 8.3 Czyszczenie filtrów

**Flow:**
1. Użytkownik klika "Wyczyść"
2. `clearFilters()` ustawia wszystkie filtry na null
3. nuqs usuwa parametry z URL: `/tasks`
4. Automatyczny refetch wszystkich zadań
5. Lista się re-renderuje

**Warunkowe wyświetlanie:**
- Przycisk "Wyczyść" pojawia się tylko gdy jakikolwiek filtr jest aktywny

### 8.4 Kliknięcie w zadanie

**Flow:**
1. Użytkownik klika w TaskCard (lub Enter/Space)
2. `onClick` handler wywołuje callback z parent
3. W przyszłości: otwarcie modalu ze szczegółami / przekierowanie do edycji

**Accessibility:**
- Karta ma `role="button"` i `tabIndex={0}`
- Obsługa Enter i Space dla aktywacji
- Focus visible styles dla nawigacji klawiaturą

### 8.5 Tworzenie nowego zadania

**Flow:**
1. Użytkownik klika "Nowe zadanie" w PageHeader
2. Otwiera się modal z CreateTaskForm
3. Użytkownik wypełnia formularz
4. Walidacja HTML5 przy próbie submit
5. Po submit wywołanie `mutation.mutate(formData)`
6. POST /api/tasks z danymi formularza
7. Backend waliduje (Zod), tworzy zadanie, zwraca 201
8. `onSuccess`: invalidacja cache, toast success, zamknięcie modalu
9. Lista zadań automatycznie się odświeża (refetch)

**Obsługa błędów:**
- Walidacja frontend: HTML5 required, min, step
- Walidacja backend: Zod schema, custom business rules
- Błędy wyświetlane jako toast z przyjaznym komunikatem

## 9. Warunki i walidacja

### 9.1 Walidacja filtrów (frontend)

**Komponent:** TaskFilters

**Warunki sprawdzane:**
1. **Wartość select nie jest pusta przed wysłaniem**
   - Implementacja: konwersja pustego stringa na null
   - Wpływ: usunięcie filtra z URL

2. **Konwersja boolean is_private**
   - Warunek: wartość "true" lub "false" z select
   - Implementacja: `isPrivate === "true" ? true : isPrivate === "false" ? false : undefined`
   - Wpływ: poprawny typ w query params

3. **Walidacja enum values**
   - Select options są hard-coded (tylko dozwolone wartości)
   - Brak możliwości wysłania nieprawidłowej wartości

### 9.2 Walidacja formularza (frontend)

**Komponent:** CreateTaskForm

**Warunki HTML5:**
1. **title - required**
   - Nie może być puste
   - Blokada submit przy pustym polu
   
2. **estimate_minutes - required, min, step**
   - `type="number"` - tylko cyfry
   - `min="15"` - minimum 15 minut
   - `step="15"` - wielokrotność 15
   - Browser pokazuje błąd przy nieprawidłowej wartości

3. **priority - required**
   - Select zawsze ma wartość (domyślnie "medium")
   - Brak możliwości submit bez wyboru

**Warunki biznesowe (sprawdzane na backend):**
- W CreateTaskForm nie ma dodatkowej logiki walidacji
- Wszystkie warunki biznesowe są w Zod schema na backend

### 9.3 Walidacja odpowiedzi API (frontend)

**Komponent:** TaskList

**Warunki sprawdzane:**
1. **Response status OK**
   ```typescript
   if (!response.ok) {
     throw new Error("Failed to fetch tasks");
   }
   ```
   - Wpływ: wyświetlenie error state

2. **Data jest tablicą**
   ```typescript
   if (!tasks || tasks.length === 0) {
     // Empty state
   }
   ```
   - Wpływ: wyświetlenie empty state lub listy

3. **Każdy task ma wymagane pola**
   - TypeScript zapewnia type safety
   - Brak runtime validation (zakładamy, że API zwraca poprawne dane)

### 9.4 Walidacja privacy masking (frontend)

**Komponent:** TaskCard

**Warunki sprawdzane:**
1. **Czy zadanie jest prywatne I opis jest null**
   ```typescript
   if (task.is_private && task.description === null) {
     // Wyświetl "[Szczegóły prywatne]"
   }
   ```
   - Wpływ: maskowanie opisu dla nieuprzywilejowanych użytkowników

2. **Czy zadanie ma opis do wyświetlenia**
   ```typescript
   {task.description && !task.is_private && (
     <CardDescription>{task.description}</CardDescription>
   )}
   ```
   - Wpływ: warunkowe renderowanie opisu

### 9.5 Walidacja conditional rendering

**Różne komponenty:**

**TaskCard - ETA display:**
```typescript
{task.eta && (
  <div>ETA: {format(parseISO(task.eta), ...)}</div>
)}
```
- Warunek: `task.eta !== null`
- Wpływ: ETA pokazywane tylko gdy obliczone (100% estymacji zaplanowane)

**TaskCard - Due date display:**
```typescript
{task.due_date && (
  <div>Termin: {format(parseISO(task.due_date), ...)}</div>
)}
```
- Warunek: `task.due_date !== null`
- Wpływ: data docelowa pokazywana tylko gdy ustawiona

**TaskCard - PrivateTaskBadge:**
```typescript
{task.is_private && <PrivateTaskBadge />}
```
- Warunek: `task.is_private === true`
- Wpływ: badge widoczny tylko dla zadań prywatnych

**TaskCard - Assigned by:**
```typescript
{showAssignedBy && task.created_by && (
  <div>Przypisane przez: {task.created_by}</div>
)}
```
- Warunek: prop `showAssignedBy === true` AND `task.created_by !== null`
- Wpływ: informacja o autorze widoczna warunkow

**TaskFilters - Clear button:**
```typescript
{Object.values(filters).some((v) => v !== undefined) && (
  <Button onClick={clearFilters}>Wyczyść</Button>
)}
```
- Warunek: co najmniej jeden filtr jest aktywny
- Wpływ: przycisk czyszczenia widoczny tylko gdy są filtry

### 9.6 Walidacja uprawnień (backend RLS)

**Sprawdzane automatycznie przez Supabase:**
- Employee: czy `assigned_user_id = auth.uid()` OR zadanie przypisane do jego działu
- Manager: czy użytkownik jest w jego dziale OR zadanie w zarządzanym dziale
- Admin: zawsze true

**Frontend:**
- Nie sprawdza uprawnień jawnie
- Zakłada, że API zwraca tylko dozwolone zadania
- RLS jest transparentny dla frontend

## 10. Obsługa błędów

### 10.1 Błędy pobierania zadań (TaskList)

**Scenariusz 1: Błąd sieci**
- **Przyczyna:** Brak połączenia internetowego, timeout
- **Wykrywanie:** `fetch` rzuca błąd, React Query przechwytuje w `error`
- **Obsługa UI:**
  ```typescript
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        Błąd ładowania zadań. Spróbuj odświeżyć stronę.
      </div>
    );
  }
  ```
- **Retry:** React Query automatycznie retry 3x z exponential backoff
- **Logging:** Console.error, w przyszłości Sentry

**Scenariusz 2: 401 Unauthorized**
- **Przyczyna:** Wygasła sesja, brak tokenu
- **Wykrywanie:** `response.status === 401`
- **Obsługa:** Middleware Astro powinno przekierować do `/login`
- **Fallback:** Jeśli dojdzie do komponentu, wyświetlenie error message

**Scenariusz 3: 500 Internal Server Error**
- **Przyczyna:** Błąd na backendzie (DB, RLS, ETA calculation)
- **Wykrywanie:** `response.status === 500`
- **Obsługa UI:** Ten sam error state co błąd sieci
- **Logging:** Backend loguje szczegóły, frontend pokazuje generyczny komunikat

**Scenariusz 4: Nieprawidłowa odpowiedź JSON**
- **Przyczyna:** Malformed response z API
- **Wykrywanie:** `response.json()` rzuca błąd
- **Obsługa:** React Query przechwytuje jako error
- **UI:** Error state z komunikatem

### 10.2 Błędy tworzenia zadania (CreateTaskForm)

**Scenariusz 1: Walidacja frontend (HTML5)**
- **Przyczyna:** Puste required pole, nieprawidłowa wartość number
- **Wykrywanie:** Browser native validation
- **Obsługa:** Browser pokazuje tooltip, blokuje submit
- **UI:** Focus na nieprawidłowym polu, czerwona ramka

**Scenariusz 2: Walidacja backend (400 Bad Request)**
- **Przyczyna:** Zod validation failed (np. estimate_minutes < 15)
- **Wykrywanie:** `response.status === 400`
- **Obsługa:**
  ```typescript
  onError: (error) => {
    toast.error(getErrorMessage(error));
  }
  ```
- **UI:** Toast notification z przyjaznym komunikatem
- **Mapping błędów:** `getErrorMessage()` mapuje technical errors na user-friendly

**Scenariusz 3: 403 Forbidden**
- **Przyczyna:** Użytkownik nie ma uprawnień do utworzenia zadania
- **Wykrywanie:** `response.status === 403`
- **Obsługa:** Toast "Nie masz uprawnień do wykonania tej operacji"
- **Logging:** Zapisanie próby nieautoryzowanej akcji

**Scenariusz 4: 500 Internal Server Error**
- **Przyczyna:** Błąd zapisu do bazy, trigger failed
- **Wykrywanie:** `response.status === 500`
- **Obsługa:** Toast "Błąd serwera. Spróbuj ponownie później"
- **UI:** Formularz pozostaje wypełniony (dane nie zostają wyczyszczone)
- **Retry:** Użytkownik może spróbować ponownie submit

**Scenariusz 5: Błąd sieci podczas mutation**
- **Przyczyna:** Timeout, connection lost
- **Wykrywanie:** `fetch` rzuca błąd
- **Obsługa:** Toast "Błąd połączenia. Sprawdź połączenie internetowe"
- **Retry:** Użytkownik musi ręcznie spróbować ponownie

### 10.3 Obsługa pustych stanów

**Brak zadań (nie błąd):**
```typescript
if (!tasks || tasks.length === 0) {
  return (
    <div className="rounded-lg border bg-muted p-12 text-center">
      <p className="text-muted-foreground">Brak zadań do wyświetlenia</p>
    </div>
  );
}
```

**Brak wyników po filtracji:**
- Ten sam UI co brak zadań
- Sugestia: przycisk "Wyczyść filtry" widoczny w TaskFilters

### 10.4 Error boundaries (future enhancement)

**React Error Boundary:**
- Opakowuje główne komponenty
- Przechwytuje błędy renderowania
- Wyświetla fallback UI: "Coś poszło nie tak"
- Logging do Sentry z komponentem i stack trace

**Przykład:**
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <TaskList filters={filters} />
</ErrorBoundary>
```

### 10.5 Utility functions dla error handling

**getErrorMessage(error):**
- Lokalizacja: `src/lib/utils/error-messages.ts`
- Mapowanie HTTP status codes na polskie komunikaty
- Mapowanie znanych błędów API na user-friendly messages
- Fallback: "Wystąpił nieoczekiwany błąd"

**formatValidationErrors(errors):**
- Formatowanie błędów Zod do czytelnej formy
- Użycie w Toast notifications

### 10.6 Logging i monitoring (future)

**Console logging (development):**
- `console.error` dla wszystkich błędów
- Stack traces w konsoli przeglądarki

**Sentry integration (production):**
- Automatyczne wysyłanie błędów
- Kontekst: user ID, page, action
- Source maps dla readable stack traces

**Custom event tracking:**
- Tracking error rates per endpoint
- Alerting przy error rate > threshold

## 11. Kroki implementacji

### Krok 1: Weryfikacja infrastruktury

**1.1 Sprawdzenie middleware Astro**
- [ ] Zweryfikować `src/middleware/index.ts`
- [ ] Upewnić się, że weryfikuje sesję Supabase
- [ ] Sprawdzić, czy `locals.user` zawiera `id` i `app_role`
- [ ] Przetestować przekierowanie do `/login` przy braku sesji

**1.2 Weryfikacja typów bazy danych**
- [ ] Sprawdzić `src/db/database.types.ts`
- [ ] Upewnić się, że typy są aktualne
- [ ] Jeśli nie, uruchomić: `supabase gen types typescript --project-id <id> > src/db/database.types.ts`

**1.3 Weryfikacja endpointu API**
- [ ] Sprawdzić, czy `src/pages/api/tasks/index.ts` istnieje i jest poprawnie zaimplementowany
- [ ] Przetestować GET /api/tasks z różnymi filtrami
- [ ] Przetestować POST /api/tasks z różnymi payloadami
- [ ] Zweryfikować RLS policies w Supabase Dashboard

### Krok 2: Implementacja custom hooks

**2.1 Hook useTaskFilters (już istnieje)**
- [x] Zweryfikować implementację w `src/lib/utils/query-params.ts`
- [x] Sprawdzić, czy wszystkie filtry są obsługiwane
- [x] Przetestować synchronizację z URL

**2.2 Hook useTaskMutations (opcjonalny - future)**
- [ ] Utworzyć `src/lib/hooks/useTaskMutations.ts`
- [ ] Zaimplementować mutations: create, update, delete
- [ ] Dodać automatyczną invalidację cache

### Krok 3: Implementacja komponentów UI (badges)

**3.1 PriorityBadge (już istnieje)**
- [x] Zweryfikować `src/components/ui/priority-badge.tsx`
- [x] Sprawdzić mapowanie priorytetów na warianty
- [x] Przetestować z różnymi priorytetami

**3.2 StatusBadge (już istnieje)**
- [x] Zweryfikować `src/components/ui/status-badge.tsx`
- [x] Sprawdzić mapowanie statusów na warianty
- [x] Przetestować z różnymi statusami

**3.3 PrivateTaskBadge (już istnieje)**
- [x] Zweryfikować `src/components/ui/private-task-badge.tsx`
- [x] Sprawdzić wyświetlanie i styling

### Krok 4: Implementacja TaskCard

**4.1 Struktura komponentu**
- [x] Utworzony plik `src/components/tasks/TaskCard.tsx`
- [x] Zaimplementowana struktura Card z shadcn/ui
- [x] Dodano wszystkie sekcje: header, content, footer (future)

**4.2 Wyświetlanie danych**
- [x] Tytuł zadania w CardTitle
- [x] Badges: Priority, Status, Private (warunkowy)
- [x] Opis lub "[Szczegóły prywatne]" z privacy masking
- [x] Estymacja w formacie "Xh Ymin"
- [x] Data docelowa (warunkowa) z formatowaniem date-fns
- [x] ETA (warunkowe) z formatowaniem i zielonym kolorem
- [x] "Przypisane przez" (warunkowe)

**4.3 Interaktywność i accessibility**
- [x] Obsługa onClick
- [x] Obsługa onKeyDown (Enter, Space)
- [x] role="button" i tabIndex={0}
- [x] sr-only dla labelek <dt>
- [x] Hover effects i cursor pointer

**4.4 Testy manualne**
- [ ] Przetestować kliknięcie myszą
- [ ] Przetestować nawigację klawiaturą (Tab, Enter, Space)
- [ ] Przetestować z różnymi typami zadań (prywatne, z ETA, bez due_date, etc.)
- [ ] Sprawdzić responsywność na różnych rozdzielczościach

### Krok 5: Implementacja TaskList

**5.1 Setup React Query**
- [x] Funkcja fetchTasks z budowaniem URL params
- [x] useQuery z queryKey ["tasks", filters]
- [x] Obsługa isLoading, error, data states

**5.2 Stany UI**
- [x] Loading state z Spinner component
- [x] Error state z czerwonym alertem
- [x] Empty state z informacją "Brak zadań"
- [x] Success state z siatką TaskCard

**5.3 Grid layout**
- [x] Responsywna siatka: `sm:grid-cols-2 lg:grid-cols-3`
- [x] Gap między kartami
- [x] Mapowanie tasks → TaskCard

**5.4 Props handling**
- [x] Przyjmowanie filters z parent
- [x] Callback onTaskClick (przekazywany do TaskCard)

**5.5 Testy manualne**
- [ ] Przetestować ładowanie (loading state)
- [ ] Zasymulować błąd (error state) - wyłączyć internet
- [ ] Przetestować pustą listę (empty state) - zaaplikować filtr bez wyników
- [ ] Przetestować listę z wieloma zadaniami
- [ ] Sprawdzić automatyczny refetch przy zmianie filtrów

### Krok 6: Implementacja TaskFilters

**6.1 Setup nuqs**
- [x] Opakownie w NuqsAdapter
- [x] Hook useTaskFilters()

**6.2 Implementacja filtrów**
- [x] Status Select z opcjami
- [x] Priority Select z opcjami
- [x] Visibility Select (is_private) z opcjami
- [x] Search Input (placeholder, do implementacji funkcjonalności)

**6.3 Clear filters button**
- [x] Warunkowe renderowanie (gdy są aktywne filtry)
- [x] Obsługa onClick → clearFilters()
- [x] Ikona X

**6.4 Layout i styling**
- [x] Grid layout dla filtrów: `sm:grid-cols-2 lg:grid-cols-4`
- [x] Card container z padding
- [x] Label dla każdego filtra

**6.5 Testy manualne**
- [ ] Przetestować zmianę każdego filtra
- [ ] Sprawdzić synchronizację z URL
- [ ] Przetestować przycisk "Wyczyść"
- [ ] Sprawdzić, czy TaskList refetchuje przy zmianie filtrów
- [ ] Przetestować browser back/forward buttons
- [ ] Sprawdzić odświeżenie strony (czy filtry zostają)

### Krok 7: Implementacja CreateTaskForm

**7.1 Setup formularza**
- [x] Local state formData (useState)
- [x] useMutation z funkcją createTask
- [x] onSubmit handler

**7.2 Pola formularza**
- [x] Input title (required)
- [x] Textarea description
- [x] Select priority (required)
- [x] Input estimate_minutes (number, min=15, step=15, required)
- [x] Input due_date (type=date)
- [x] Checkbox is_private

**7.3 Przyciski akcji**
- [x] Button "Anuluj" (warunkowy, gdy onCancel prop)
- [x] Button "Utwórz zadanie" (disabled podczas mutation)
- [x] Loading state na przycisku

**7.4 Obsługa sukcesu/błędu**
- [x] onSuccess: invalidacja cache, toast, callback onSuccess
- [x] onError: toast z getErrorMessage()

**7.5 Walidacja**
- [x] HTML5 validation (required, min, step)
- [ ] Dodatkowa logika walidacji (opcjonalna - np. max length)

**7.6 Testy manualne**
- [ ] Przetestować submit z poprawnymi danymi
- [ ] Przetestować submit z pustymi required fields
- [ ] Przetestować submit z estimate_minutes < 15
- [ ] Przetestować submit z estimate_minutes nie będącą wielokrotnością 15
- [ ] Zasymulować błąd API (400, 403, 500)
- [ ] Sprawdzić, czy po sukcesie lista się odświeża
- [ ] Sprawdzić toast notifications

### Krok 8: Integracja w stronie tasks.astro

**8.1 Layout i struktura**
- [x] Użycie AppLayout
- [x] PageHeader z tytułem, opisem i przyciskiem
- [ ] Modal dla CreateTaskForm (do implementacji)

**8.2 Montowanie komponentów React**
- [x] PageHeader client:load
- [x] TaskFilters client:load
- [x] TaskList client:load
- [ ] Modal client:load (future)

**8.3 Przekazywanie propsów**
- [ ] User data do PageHeader (dla permission checks)
- [ ] Filters z URL do TaskList (przez nuqs)
- [ ] Callback onTaskClick do TaskList (future - routing lub modal)

**8.4 Styling strony**
- [x] Spacing między sekcjami (space-y-6)
- [x] Responsywny layout

**8.5 Testy end-to-end**
- [ ] Pełny flow: wejście na stronę → filtrowanie → kliknięcie zadania
- [ ] Pełny flow: wejście → nowe zadanie → submit → lista odświeżona
- [ ] Testowanie na różnych rolach (employee, manager, admin)
- [ ] Testowanie z różnymi stanami danych (pusta lista, wiele zadań, zadania prywatne)

### Krok 9: Modal dla CreateTaskForm (future enhancement)

**9.1 Komponent Modal/Dialog**
- [ ] Utworzyć `src/components/tasks/CreateTaskModal.tsx`
- [ ] Użycie shadcn/ui Dialog component
- [ ] State open/closed

**9.2 Integration z PageHeader**
- [ ] onClick na Button "Nowe zadanie" → otwiera modal
- [ ] onSuccess w CreateTaskForm → zamyka modal
- [ ] onCancel w CreateTaskForm → zamyka modal

**9.3 Accessibility**
- [ ] Focus trap w modalu
- [ ] ESC key zamyka modal
- [ ] Focus management (return focus po zamknięciu)
- [ ] aria-labelledby, aria-describedby

### Krok 10: Szczegóły zadania (future enhancement)

**10.1 Routing lub modal**
- [ ] Decyzja: routing do `/tasks/:id` vs modal ze szczegółami
- [ ] Implementacja TaskDetailView lub TaskDetailModal

**10.2 Endpoint GET /api/tasks/:id**
- [ ] Implementacja endpointu (jeśli nie istnieje)
- [ ] Hook useTaskDetails(taskId)

**10.3 Wyświetlanie szczegółów**
- [ ] Wszystkie pola zadania
- [ ] Historia zmian (audit trail)
- [ ] Zaplanowane sloty (plan_slots)
- [ ] Logi czasu (time_logs)

**10.4 Akcje na zadaniu**
- [ ] Edycja zadania (modal EditTaskForm)
- [ ] Zmiana statusu (dropdown lub przyciski)
- [ ] Usunięcie zadania (z potwierdzeniem)

### Krok 11: Optymalizacje wydajności

**11.1 React.memo dla TaskCard**
- [ ] Owinąć TaskCard w React.memo
- [ ] Custom comparison function (jeśli potrzeba)
- [ ] Przetestować re-renders (React DevTools Profiler)

**11.2 useCallback dla handlerów**
- [ ] W TaskList: useCallback dla onTaskClick
- [ ] W TaskFilters: useCallback dla setterów (jeśli przekazywane)

**11.3 Paginacja lub virtual scrolling**
- [ ] Implementacja paginacji w API (limit, offset)
- [ ] UI: przyciski prev/next lub infinite scroll
- [ ] Alternatywa: react-virtual dla bardzo długich list

**11.4 Debouncing dla search input**
- [ ] useDebounce hook dla search query
- [ ] Delay 300-500ms przed wywołaniem API

### Krok 12: Testy automatyczne (opcjonalne)

**12.1 Unit tests komponentów**
- [ ] TaskCard: różne stany (prywatne, z ETA, bez due_date)
- [ ] TaskList: loading, error, empty, success states
- [ ] TaskFilters: zmiana filtrów, clear filters
- [ ] CreateTaskForm: submit, walidacja, error handling

**12.2 Integration tests**
- [ ] Pełny flow filtrowania
- [ ] Pełny flow tworzenia zadania
- [ ] Mock API responses

**12.3 E2E tests (Playwright/Cypress)**
- [ ] User journey: login → tasks → filter → create task
- [ ] Różne role użytkowników
- [ ] Error scenarios

### Krok 13: Accessibility audit

**13.1 Keyboard navigation**
- [ ] Sprawdzić Tab order
- [ ] Przetestować wszystkie interakcje klawiaturą
- [ ] Focus visible styles

**13.2 Screen reader testing**
- [ ] Przetestować z NVDA/JAWS
- [ ] Sprawdzić ARIA labels i landmarks
- [ ] Sprawdzić announcements (live regions)

**13.3 Color contrast**
- [ ] Sprawdzić kontrast badges
- [ ] Sprawdzić kontrast error messages
- [ ] WCAG AA compliance

### Krok 14: Documentation

**14.1 Komentarze w kodzie**
- [ ] JSDoc dla wszystkich komponentów
- [ ] Komentarze dla skomplikowanych logik
- [ ] TODO comments dla future enhancements

**14.2 README lub docs**
- [ ] Opis widoku Tasks
- [ ] Instrukcje użytkowania dla dev
- [ ] Znane ograniczenia

**14.3 Storybook (opcjonalnie)**
- [ ] Stories dla TaskCard z różnymi props
- [ ] Stories dla badges
- [ ] Interactive controls

### Krok 15: Code review i merge

**15.1 Self-review**
- [ ] Przejrzeć cały kod
- [ ] Sprawdzić linter warnings
- [ ] Sprawdzić TypeScript errors
- [ ] Sprawdzić console.logs (usunąć debug logs)

**15.2 Pull request**
- [ ] Utworzyć PR z opisem zmian
- [ ] Dodać screenshots UI
- [ ] Dodać listę testowanych scenariuszy

**15.3 Code review**
- [ ] Uzyskać approval od reviewera
- [ ] Wprowadzić feedback
- [ ] Final tests

**15.4 Merge i deployment**
- [ ] Merge do main/develop
- [ ] Deploy do staging
- [ ] Smoke tests na staging
- [ ] Deploy do production

---

## Podsumowanie

Ten plan zapewnia kompleksowe wdrożenie widoku Zadania zgodnie z wymaganiami PRD i user stories. Kluczowe aspekty:

1. **Bezpieczeństwo**: RLS policies, privacy masking, autoryzacja per rola
2. **Wydajność**: React Query caching, batch queries, optimistic updates
3. **UX**: Filtrowanie z URL sync, loading states, error handling, accessibility
4. **Maintainability**: Service layer, custom hooks, type safety, czytelny kod

Implementacja powinna być realizowana iteracyjnie, z testowaniem po każdym kroku. Priorytet: podstawowa funkcjonalność (kroki 1-8), następnie enhancements (kroki 9-15).

