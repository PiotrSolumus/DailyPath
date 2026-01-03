# Architektura UI - DailyPath MVP

## Przegląd

Ten dokument opisuje zaimplementowaną architekturę interfejsu użytkownika dla aplikacji DailyPath, zgodną z rekomendacjami z planu architektury UI.

## Struktura projektu

```
src/
├── components/
│   ├── calendar/           # Komponenty kalendarza
│   │   ├── CalendarGrid.tsx
│   │   ├── WeekGrid.tsx
│   │   ├── CalendarControls.tsx
│   │   ├── TimeSlot.tsx
│   │   ├── TaskSlot.tsx
│   │   ├── DraggableTaskSlot.tsx
│   │   ├── DroppableTimeSlot.tsx
│   │   ├── PlanCalendar.tsx
│   │   └── KeyboardPlanControls.tsx
│   ├── layout/            # Layout i nawigacja
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   ├── onboarding/        # Kreator pierwszego dnia
│   │   ├── OnboardingWizard.tsx
│   │   └── steps/
│   ├── plan/              # Widok planu dnia
│   │   └── PlanView.tsx
│   ├── reports/           # Raporty
│   │   ├── ReportView.tsx
│   │   ├── ReportFilters.tsx
│   │   └── DailyReport.tsx
│   ├── tasks/             # Zarządzanie zadaniami
│   │   ├── TaskList.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskFilters.tsx
│   │   └── CreateTaskForm.tsx
│   ├── team/              # Widok zespołu (menedżer)
│   │   ├── TeamView.tsx
│   │   ├── TeamMemberCard.tsx
│   │   └── MemberPlanModal.tsx
│   └── ui/                # Komponenty bazowe
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── spinner.tsx
│       ├── alert-dialog.tsx
│       ├── private-task-badge.tsx
│       ├── priority-badge.tsx
│       └── status-badge.tsx
├── lib/
│   ├── contexts/          # Context providers
│   │   ├── AppProviders.tsx
│   │   ├── AuthContext.tsx
│   │   ├── QueryProvider.tsx
│   │   └── ToastProvider.tsx
│   ├── utils/             # Utility functions
│   │   ├── time.ts
│   │   ├── error-messages.ts
│   │   ├── query-params.ts
│   │   └── csv-export.ts
│   └── services/          # API services
├── layouts/
│   └── AppLayout.astro    # Główny layout Astro
└── pages/
    ├── dashboard.astro
    ├── plan.astro
    ├── tasks.astro
    ├── team.astro
    ├── reports.astro
    └── onboarding.astro
```

## Zaimplementowane rekomendacje

### 1. Layout wielopanelowy z sidebar

**Implementacja:**
- `AppLayout.tsx` - główny kontener
- `Sidebar.tsx` - nawigacja oparta o role (employee/manager/admin)
- `AppLayout.astro` - wrapper Astro z SSR

**Funkcje:**
- Dynamiczne menu w zależności od roli użytkownika
- Informacje o użytkowniku i dziale
- Wskaźniki nieodczytanych powiadomień (badge)

### 2. Kalendarz dzień/tydzień

**Implementacja:**
- `PlanCalendar.tsx` - główny komponent z przełącznikiem widoku
- `CalendarGrid.tsx` - widok dnia (24h w slotach 15 min)
- `WeekGrid.tsx` - widok tygodnia
- `CalendarControls.tsx` - nawigacja i przełącznik widoku

**Funkcje:**
- Sloty 15-minutowe z wizualnym oznaczeniem godzin
- Przełączanie dzień/tydzień z zachowaniem stanu w URL
- Nawigacja poprzedni/następny/dzisiaj

### 3. Drag & Drop z obsługą klawiatury

**Implementacja:**
- `@dnd-kit/core` - drag & drop system
- `DraggableTaskSlot.tsx` - przeciągalne sloty
- `DroppableTimeSlot.tsx` - miejsca docelowe
- `KeyboardPlanControls.tsx` - alternatywna obsługa klawiatury

**Funkcje:**
- Przeciąganie myszy z aktywacją po 8px ruchu
- Keyboard sensor dla dostępności
- Przyciski +/- 15 min i time picker
- Detekcja i potwierdzanie konfliktów overlapa

### 4. Zarządzanie stanem

**Implementacja:**
- `TanStack Query` (React Query) - server state
- `AuthContext.tsx` - stan użytkownika
- `nuqs` - synchronizacja filtrów z URL

**Funkcje:**
- Cache i automatic refetch dla danych API
- Optimistic updates
- Error handling i retry logic
- URL jako source of truth dla filtrów

### 5. Filtry z synchronizacją URL

**Implementacja:**
- `useTaskFilters()` - hook do filtrów zadań
- `useReportFilters()` - hook do filtrów raportów
- `TaskFilters.tsx` - UI filtrów zadań
- `ReportFilters.tsx` - UI filtrów raportów

**Funkcje:**
- Wszystkie filtry w query params
- Deep linking i sharing możliwe
- Debounce dla wpisywania
- Clear filters w jednym kliknięciu

### 6. Wizualne oznaczanie overlappingu

**Implementacja:**
- `TaskSlot.tsx` - komponент slotu z wariantami
- CSS stripes pattern dla konfliktów
- Ikona korony dla slotów przełożonego

**Funkcje:**
- Czerwone obramowanie + ukośne linie dla overlapa
- Tooltip z informacjami o slocie
- Badge "Konflikt" na dole slotu
- Ikona korony dla slotów stworzonych przez menedżera

### 7. Obsługa private tasks

**Implementacja:**
- `PrivateTaskBadge.tsx` - badge z kłódką
- Conditional rendering opisu
- Masking w `TaskCard.tsx`

**Funkcje:**
- Ikona kłódki dla zadań prywatnych
- "[Szczegóły prywatne]" zamiast opisu
- Tytuł widoczny zawsze (zgodnie z PRD)

### 8. Manager view time tracking

**Implementacja:**
- `TeamView.tsx` - performance tracking
- `MemberPlanModal.tsx` - modal z planem pracownika
- Event tracking do `/api/events`

**Funkcje:**
- `performance.now()` do pomiaru czasu
- Event `manager_view_render` dla listy zespołu
- Event `manager_view_time` dla otwarcia planu pracownika
- Automatyczne wysyłanie metryk do API

### 9. Onboarding wizard

**Implementacja:**
- `OnboardingWizard.tsx` - multi-step wizard
- `WorkingHoursStep.tsx` - konfiguracja godzin
- `TimezoneStep.tsx` - wybór strefy czasowej
- `PreferencesStep.tsx` - preferencje UI
- localStorage backup po każdym kroku

**Funkcje:**
- 3 kroki z wizualnym progress bar
- Automatyczny zapis do localStorage
- Przywracanie stanu po refresh
- Submit do API i redirect do dashboard

### 10. System notyfikacji

**Implementacja:**
- `sonner` - toast library
- `ToastProvider.tsx` - globalny provider
- `error-messages.ts` - mapowanie błędów

**Funkcje:**
- 4 typy: success, error, warning, info
- User-friendly messages dla błędów API
- ARIA live regions dla screen readers
- Automatyczne zamykanie po 5s

## Technologie użyte

### Core
- **Astro 5** - SSR framework
- **React 19** - komponenty interaktywne
- **TypeScript 5** - type safety
- **Tailwind 4** - styling

### State Management
- **TanStack Query** - server state
- **nuqs** - URL state sync

### UI Components
- **shadcn/ui** - bazowe komponenty
- **lucide-react** - ikony
- **sonner** - toasts

### Drag & Drop
- **@dnd-kit** - drag & drop system

### Date Handling
- **date-fns** - manipulacja datami
- **date-fns-tz** - strefy czasowe

## Wzorce i best practices

### 1. Composition over inheritance
Wszystkie komponenty używają composition pattern - małe, reusable pieces.

### 2. Separation of concerns
- Components: UI i interakcja
- Services: logika biznesowa
- Utils: funkcje pomocnicze
- Contexts: stan globalny

### 3. Accessibility
- ARIA labels i roles
- Keyboard navigation
- Screen reader support
- Focus management

### 4. Error handling
- Try-catch w async operations
- Error boundaries (do dodania)
- User-friendly error messages
- Fallback UI

### 5. Performance
- React Query caching
- Lazy loading komponentów
- Debounce dla search
- Optimistic updates

## Integracja z API

Wszystkie komponenty są przygotowane do integracji z API endpoints:

- `GET /api/users/me` - user profile
- `GET /api/tasks` - lista zadań
- `POST /api/tasks` - utworzenie zadania
- `PATCH /api/tasks/:id` - aktualizacja zadania
- `GET /api/plan-slots` - sloty planu
- `POST /api/plan-slots` - utworzenie slotu
- `PATCH /api/plan-slots/:id` - przesunięcie slotu
- `GET /api/reports/daily` - raport dzienny
- `POST /api/events` - tracking eventów

## Następne kroki

1. **Połączenie z realnym API** - zamiana mock data na rzeczywiste endpointy
2. **Testy jednostkowe** - vitest + testing-library
3. **Testy E2E** - playwright
4. **Error boundaries** - obsługa błędów React
5. **Storybook** - dokumentacja komponentów
6. **Performance optimization** - profiling i optymalizacje

## Uruchomienie

```bash
# Instalacja zależności
npm install

# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Struktura routingu

- `/dashboard` - główny dashboard
- `/plan` - widok planu dnia/tygodnia
- `/tasks` - lista zadań z filtrami
- `/team` - podgląd zespołu (tylko manager/admin)
- `/reports` - raporty z eksportem CSV
- `/onboarding` - kreator pierwszego dnia
- `/settings` - ustawienia użytkownika

## Role i uprawnienia

Role są zarządzane przez `AuthContext` i `Sidebar` dynamicznie pokazuje/ukrywa elementy:

- **Employee**: dashboard, plan, tasks, time-logs, reports, settings
- **Manager**: wszystko z employee + team
- **Admin**: wszystko + admin panel

## Wsparcie przeglądarek

Ostatnie 2 wersje:
- Chrome
- Firefox
- Safari
- Edge

## Dostępność (a11y)

- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode support
- Focus indicators

