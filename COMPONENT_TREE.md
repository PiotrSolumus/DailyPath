# Drzewo komponentów DailyPath

```
DailyPath Application
│
├── Layout Components
│   ├── AppLayout
│   │   ├── AppProviders (context)
│   │   ├── Sidebar
│   │   │   ├── Navigation Items
│   │   │   └── User Info / Login Button
│   │   └── Main Content Area
│   │       └── PageHeader (optional)
│   │           ├── Title
│   │           ├── Description
│   │           └── Actions
│   │
│   ├── AuthLayout
│   └── Layout (base)
│
├── Authentication Components
│   ├── LoginForm
│   │   └── UI Components (Button, Input, Label)
│   ├── RegisterForm
│   │   └── UI Components
│   ├── RequestPasswordResetForm
│   │   └── UI Components
│   └── SetNewPasswordForm
│       └── UI Components
│
├── Dashboard / Views
│   │
│   ├── Plan View
│   │   ├── PlanViewWrapper
│   │   └── PlanView
│   │       ├── PlanCalendar
│   │       │   ├── CalendarControls
│   │       │   │   ├── View Toggle (Day/Week)
│   │       │   │   ├── Date Navigation
│   │       │   │   └── Date Picker
│   │       │   ├── DndContext (drag & drop)
│   │       │   ├── CalendarGrid (Day View)
│   │       │   │   ├── TimeSlot
│   │       │   │   └── DraggableTaskSlot
│   │       │   │       └── TaskSlot
│   │       │   └── WeekGrid (Week View)
│   │       │       ├── DroppableTimeSlot
│   │       │       └── WeekTaskSlot
│   │       ├── KeyboardPlanControls
│   │       └── AlertDialog (overlap confirmation)
│   │
│   ├── Tasks View
│   │   ├── TaskListWrapper
│   │   └── TaskList
│   │       ├── TaskFiltersWrapper
│   │       │   └── TaskFilters
│   │       │       └── UI Components (Select, Input, Button)
│   │       ├── TaskCard (grid)
│   │       │   ├── StatusBadge
│   │       │   ├── PriorityBadge
│   │       │   ├── PrivateTaskBadge
│   │       │   └── AddToPlanModal (optional)
│   │       └── EditTaskModal
│   │           └── EditTaskForm
│   │               └── UI Components
│   │
│   ├── Time Logs View
│   │   ├── TimeLogsViewWrapper
│   │   └── TimeLogsView
│   │       ├── TimeLogListWrapper
│   │       │   └── TimeLogList
│   │       │       └── TimeLogCard
│   │       └── CreateTimeLogForm
│   │           └── UI Components
│   │
│   ├── Reports View
│   │   ├── ReportViewWrapper
│   │   └── ReportView
│   │       ├── ReportFilters
│   │       │   └── UI Components (Select, Button)
│   │       └── DailyReport
│   │           └── Report Data Table
│   │
│   ├── Team View
│   │   ├── TeamViewWrapper
│   │   └── TeamView
│   │       ├── Search Input
│   │       ├── TeamMemberCard (grid)
│   │       │   └── Progress Indicators
│   │       └── MemberPlanModal
│   │           └── PlanView (manager view)
│   │
│   ├── Admin View
│   │   ├── AdminViewWrapper
│   │   └── AdminView
│   │       ├── Tab Navigation
│   │       ├── UsersManagement
│   │       │   └── User Management Table/List
│   │       ├── DepartmentsManagement
│   │       │   └── Department Management UI
│   │       ├── SystemSettings
│   │       └── SystemInfo
│   │
│   ├── Settings View
│   │   ├── SettingsViewWrapper
│   │   └── SettingsView
│   │       └── Settings Forms
│   │
│   └── Onboarding
│       ├── OnboardingWizardWrapper
│       └── OnboardingWizard
│           ├── TimezoneStep
│           ├── WorkingHoursStep
│           └── PreferencesStep
│
├── UI Components (Shadcn/ui)
│   ├── alert.tsx
│   ├── alert-dialog.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── card.tsx
│   │   ├── CardHeader
│   │   ├── CardTitle
│   │   ├── CardDescription
│   │   └── CardContent
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   ├── spinner.tsx
│   ├── priority-badge.tsx
│   ├── private-task-badge.tsx
│   └── status-badge.tsx
│
├── Task Modals
│   ├── CreateTaskModal
│   │   ├── CreateTaskModalWrapper
│   │   └── CreateTaskForm
│   │       ├── AssigneeSelector
│   │       └── UI Components
│   └── AddToPlanModal
│       └── Time Slot Selection
│
└── Shared Components
    ├── RulePreview
    └── Welcome.astro

```

## Hierarchia głównych widoków

```
AppLayout (root)
│
├── Sidebar (navigation)
│
└── Main Content
    │
    ├── Dashboard Page
    │
    ├── Plan Page
    │   └── PlanView
    │       └── PlanCalendar
    │
    ├── Tasks Page
    │   ├── TaskFilters
    │   └── TaskList
    │       └── TaskCard[]
    │
    ├── Time Logs Page
    │   ├── TimeLogList
    │   └── CreateTimeLogForm
    │
    ├── Reports Page
    │   ├── ReportFilters
    │   └── DailyReport
    │
    ├── Team Page
    │   ├── TeamView
    │   │   └── TeamMemberCard[]
    │   └── MemberPlanModal
    │
    ├── Admin Page
    │   └── AdminView
    │       ├── UsersManagement
    │       └── DepartmentsManagement
    │
    └── Settings Page
        └── SettingsView
```

## Zależności komponentów

### PlanCalendar
- Używa: CalendarControls, CalendarGrid, WeekGrid, DraggableTaskSlot, WeekTaskSlot
- Zawiera: DndContext (drag & drop)
- Wyświetla: AlertDialog dla konfliktów

### TaskList
- Używa: TaskCard, EditTaskModal, TaskFilters
- Renderuje: Grid TaskCard[]

### AdminView
- Używa: UsersManagement, DepartmentsManagement
- Zawiera: Tab navigation

### TeamView
- Używa: TeamMemberCard, MemberPlanModal
- MemberPlanModal używa: PlanView (w trybie manager)

## Konteksty (Contexts)
- AppProviders
  - AuthContext
  - QueryClient (React Query)
  - Inne konteksty aplikacji
