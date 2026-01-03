# Developer Guide - DailyPath UI Components

## Szybki start

### 1. Dodawanie nowej strony

```astro
---
// src/pages/my-page.astro
import AppLayout from "../layouts/AppLayout.astro";
import { PageHeader } from "../components/layout/PageHeader";
import type { UserMeDTO } from "../types";

// Get user from middleware (when auth is implemented)
const user: UserMeDTO = { /* ... */ };
---

<AppLayout title="My Page - DailyPath" user={user}>
  <PageHeader
    client:load
    title="My Page"
    description="Description of my page"
    actions={
      <Button client:load onClick={() => console.log('Action')}>
        Action Button
      </Button>
    }
  />

  <div>
    <!-- Your content here -->
  </div>
</AppLayout>
```

### 2. Używanie kalendarza

```tsx
import { PlanCalendar } from "@/components/calendar/PlanCalendar";
import type { PlanSlotDTO, TaskDTO } from "@/types";

function MyCalendar() {
  const planSlots: PlanSlotDTO[] = [/* ... */];
  const tasks: TaskDTO[] = [/* ... */];

  const handleSlotMove = async (
    slotId: string,
    newStartTime: Date,
    allowOverlap: boolean
  ) => {
    // Call API to update slot
    await updatePlanSlot(slotId, newStartTime, allowOverlap);
  };

  return (
    <PlanCalendar
      planSlots={planSlots}
      tasks={tasks}
      timezone="Europe/Warsaw"
      onSlotMove={handleSlotMove}
      isManagerView={false}
    />
  );
}
```

### 3. Tworzenie listy zadań z filtrami

```tsx
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskList } from "@/components/tasks/TaskList";
import { useTaskFilters } from "@/lib/utils/query-params";
import { NuqsAdapter } from "nuqs/adapters/react";

function TasksPage() {
  const { filters } = useTaskFilters();

  return (
    <NuqsAdapter>
      <div className="space-y-6">
        <TaskFilters />
        <TaskList
          filters={filters}
          onTaskClick={(task) => console.log("Task clicked:", task)}
        />
      </div>
    </NuqsAdapter>
  );
}
```

### 4. Używanie API z TanStack Query

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function MyComponent() {
  const queryClient = useQueryClient();

  // Fetching data
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-data"],
    queryFn: async () => {
      const response = await fetch("/api/my-endpoint");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  // Mutating data
  const mutation = useMutation({
    mutationFn: async (newData: any) => {
      const response = await fetch("/api/my-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-data"] });
      toast.success("Created successfully!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <button onClick={() => mutation.mutate({ name: "Test" })}>
      Create
    </button>
  );
}
```

### 5. Tworzenie formularza

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

function MyForm() {
  const [formData, setFormData] = useState({
    name: "",
    priority: "medium",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>My Form</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit">Submit</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### 6. Używanie toastów

```tsx
import { toast } from "sonner";

// Success
toast.success("Operation completed successfully!");

// Error
toast.error("Something went wrong!");

// Warning
toast.warning("Please check your input");

// Info
toast.info("New update available");

// With action
toast("File uploaded", {
  action: {
    label: "View",
    onClick: () => console.log("View clicked"),
  },
});
```

### 7. Eksport do CSV

```tsx
import { exportToCSV, flattenForCSV } from "@/lib/utils/csv-export";

function MyReportComponent() {
  const handleExport = () => {
    const data = [
      { name: "John", age: 30, department: "Engineering" },
      { name: "Jane", age: 25, department: "Marketing" },
    ];

    // Simple export
    exportToCSV(data, "my-report");

    // Or flatten nested objects first
    const flatData = flattenForCSV(data);
    exportToCSV(flatData, "my-report");
  };

  return <Button onClick={handleExport}>Export CSV</Button>;
}
```

### 8. Praca z czasem i datami

```tsx
import {
  parsePgRange,
  formatPgRange,
  roundTo15Min,
  getDaySlots,
  rangesOverlap,
  formatTimeSlot,
} from "@/lib/utils/time";

// Parse Postgres range
const { start, end } = parsePgRange("[2026-01-03T08:00:00Z, 2026-01-03T09:30:00Z)");

// Create Postgres range
const range = formatPgRange(new Date("2026-01-03T08:00:00Z"), new Date("2026-01-03T09:30:00Z"));

// Round to 15 minutes
const rounded = roundTo15Min(new Date()); // e.g., 14:37 -> 14:30 or 14:45

// Get all 15-min slots for a day
const slots = getDaySlots(new Date());

// Check overlap
const hasOverlap = rangesOverlap(
  { start: new Date("2026-01-03T08:00:00Z"), end: new Date("2026-01-03T09:00:00Z") },
  { start: new Date("2026-01-03T08:30:00Z"), end: new Date("2026-01-03T09:30:00Z") }
);

// Format time for display
const timeString = formatTimeSlot(new Date(), "Europe/Warsaw"); // "14:30"
```

### 9. Obsługa błędów

```tsx
import { getErrorMessage } from "@/lib/utils/error-messages";
import { toast } from "sonner";

async function myApiCall() {
  try {
    const response = await fetch("/api/endpoint");

    if (!response.ok) {
      // getErrorMessage handles Response objects
      toast.error(getErrorMessage(response));
      return;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // getErrorMessage handles Error objects
    toast.error(getErrorMessage(error));
  }
}
```

### 10. Dostęp do użytkownika

```tsx
import { useAuth } from "@/lib/contexts/AuthContext";

function MyComponent() {
  const { user, isLoading, error, refetch } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading user</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      <p>Role: {user.app_role}</p>
      <p>Department: {user.active_department?.name}</p>
      <button onClick={refetch}>Refresh user data</button>
    </div>
  );
}
```

## Wzorce komponentów

### Component z loading state

```tsx
import { Spinner } from "@/components/ui/spinner";

function MyComponent() {
  const { data, isLoading } = useQuery(/* ... */);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return <div>{/* content */}</div>;
}
```

### Component z error state

```tsx
function MyComponent() {
  const { data, error } = useQuery(/* ... */);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-900">
        Error loading data. Please try again.
      </div>
    );
  }

  return <div>{/* content */}</div>;
}
```

### Component z empty state

```tsx
function MyComponent() {
  const { data } = useQuery(/* ... */);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-muted p-12 text-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return <div>{/* content */}</div>;
}
```

## Styling

### Używanie Tailwind utility classes

```tsx
// Good
<div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-6">

// Conditional classes
<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>

// Responsive
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

### Custom styles w global.css

```css
@layer components {
  .my-custom-class {
    @apply rounded-lg border bg-card p-4;
  }
}
```

## Testing (do zaimplementowania)

### Unit tests

```tsx
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

test("renders component", () => {
  render(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

### Integration tests

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("submits form", async () => {
  render(<MyForm />);

  await userEvent.type(screen.getByLabelText("Name"), "John");
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => {
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
});
```

## Debugging

### React Query Devtools

```tsx
// Add to AppProviders.tsx in development
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  {children}
  {import.meta.env.DEV && <ReactQueryDevtools />}
</QueryClientProvider>
```

### Console logging

```tsx
// Log component renders
useEffect(() => {
  console.log("Component rendered with:", { prop1, prop2 });
});

// Log API calls
const { data } = useQuery({
  queryKey: ["data"],
  queryFn: async () => {
    console.log("Fetching data...");
    const result = await fetchData();
    console.log("Data fetched:", result);
    return result;
  },
});
```

## Performance tips

1. **Memo komponentów** jeśli są drogie w renderowaniu
2. **useMemo** dla drogich obliczeń
3. **useCallback** dla funkcji przekazywanych do child components
4. **React Query caching** - domyślne 1 minuta stale time
5. **Lazy loading** dla dużych komponentów
6. **Debounce** dla search inputs

## Dobre praktyki

1. **Always handle loading states** - użytkownicy powinni wiedzieć, że coś się dzieje
2. **Always handle error states** - błędy API są nieuniknione
3. **Always handle empty states** - brak danych też jest stanem
4. **Use TypeScript** - typy zapobiegają błędom
5. **Follow naming conventions** - PascalCase dla komponentów, camelCase dla funkcji
6. **Keep components small** - jeśli > 200 linii, rozważ podział
7. **Extract hooks** - logikę można wydzielić do custom hooks
8. **Use semantic HTML** - button, nav, main, aside, etc.
9. **Add ARIA labels** - dla screen readers
10. **Test on real devices** - emulatory nie wystarczą

## Troubleshooting

### Problem: "useAuth must be used within an AuthProvider"
**Rozwiązanie:** Upewnij się, że komponent jest opakowany w `<AppProviders>` lub `<AuthProvider>`

### Problem: Filtry nie synchronizują się z URL
**Rozwiązanie:** Upewnij się, że komponent jest opakowany w `<NuqsAdapter>`

### Problem: Drag & drop nie działa
**Rozwiązanie:** Sprawdź czy `<DndContext>` opakowuje draggable i droppable komponenty

### Problem: Toasty się nie pokazują
**Rozwiązanie:** Sprawdź czy `<ToastProvider>` jest w drzewie komponentów

### Problem: TanStack Query nie cachuje
**Rozwiązanie:** Sprawdź `queryKey` - musi być taki sam dla tego samego zapytania

## Przydatne linki

- [Astro Docs](https://docs.astro.build)
- [React 19 Docs](https://react.dev)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [dnd-kit Docs](https://docs.dndkit.com)
- [date-fns Docs](https://date-fns.org)

