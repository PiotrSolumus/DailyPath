### Schemat bazy danych – DailyPatch (PostgreSQL)

Poniższy dokument definiuje kompletny schemat bazy danych dla DailyPatch zgodny z PRD i ustaleniami architektonicznymi. Czasy przechowujemy w UTC (`timestamptz`); plan/realizacja to zakresy `tstzrange` wyrównane do 15 minut. Skalowanie przewidziane przez partycjonowanie miesięczne dla tabel wolumenowych.

---

## 1. Lista tabel z kolumnami, typami i ograniczeniami

### 1.0 Wymagane rozszerzenia i typy
- Rozszerzenia:
  - `pgcrypto` (dla `gen_random_uuid()`)
  - `btree_gist` (dla `EXCLUDE USING gist` z `=`)
  - `citext` (case-insensitive e‑mail)
- Typy ENUM:
  - `app_role`: `employee | manager | admin`
  - `task_status`: `todo | in_progress | blocked | done`
  - `task_priority`: `low | medium | high`
  - `assigned_to_type`: `user | department`
  - `manager_action`: `create_task | update_task | delete_task | assign_task | reassign_task | plan_slot_create | plan_slot_update | plan_slot_delete | time_log_create | time_log_update | time_log_delete`
  - `event_type`: `daily_active_update | manager_view_open | manager_view_render | time_log_created | time_log_updated | plan_slot_created | plan_slot_updated | task_created | task_updated | task_closed`

---

### 1.1 `users`

This table is managed by Supabase Auth

- `id uuid PK DEFAULT gen_random_uuid()`
- `email citext NOT NULL UNIQUE`
- `full_name text NOT NULL`
- `app_role app_role NOT NULL DEFAULT 'employee'`
- `timezone text NOT NULL DEFAULT 'UTC'`
- `is_active boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Ograniczenia/dodatkowo:
- CHECK `email <> ''`
- Trigger `set_updated_at` do aktualizacji `updated_at`.

---

### 1.2 `departments`
- `id uuid PK DEFAULT gen_random_uuid()`
- `name text NOT NULL UNIQUE`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

---

### 1.3 `department_managers`
- `manager_user_id uuid NOT NULL FK -> users(id)`
- `department_id uuid NOT NULL FK -> departments(id)`

Klucze/ograniczenia:
- PK: `(manager_user_id, department_id)`
- Opcjonalnie: trigger weryfikujący, że `users.app_role IN ('manager','admin')` dla `manager_user_id`.

---

### 1.4 `manager_cross_views`
- `manager_user_id uuid NOT NULL FK -> users(id)`
- `department_id uuid NOT NULL FK -> departments(id)`

Klucze/ograniczenia:
- PK: `(manager_user_id, department_id)`
- Semantyka: read‑only podgląd planów działu bez możliwości edycji.

---

### 1.5 `memberships`
- `id bigserial PK`
- `user_id uuid NOT NULL FK -> users(id)`
- `department_id uuid NOT NULL FK -> departments(id)`
- `period daterange NOT NULL` (w strefie daty, zamknięta od lewej, otwarta od prawej; zalecane `[start, end)`)
- `created_at timestamptz NOT NULL DEFAULT now()`

Klucze/ograniczenia:
- EXCLUDE USING gist: `(user_id WITH =, period WITH &&)` – brak nakładających się członkostw tego samego użytkownika
- Indeksowanie wg poniższej sekcji

---

### 1.6 `user_working_hours`
- `user_id uuid NOT NULL FK -> users(id)`
- `weekday int2 NOT NULL` (0–6; 0=poniedziałek)
- `periods int4range[] NOT NULL` (minuty dnia 0–1440; bez overlapa; siatka 15')
- `updated_at timestamptz NOT NULL DEFAULT now()`

Klucze/ograniczenia:
- PK: `(user_id, weekday)`
- CHECK: każdy `int4range` mieści się w `[0,1440)` i jest wielokrotnością 15 min (dolna i górna granica)
- CHECK: brak overlapa wewnątrz `periods` (walidowane funkcją pomocniczą)

---

### 1.7 `tasks`
- `id uuid PK DEFAULT gen_random_uuid()`
- `title text NOT NULL`
- `description text NULL`
- `priority task_priority NOT NULL`
- `status task_status NOT NULL DEFAULT 'todo'`
- `estimate_minutes int NOT NULL` (CHECK `> 0`)
- `due_date date NULL`
- `is_private boolean NOT NULL DEFAULT false`
- `assigned_to_type assigned_to_type NOT NULL`
- `assigned_user_id uuid NULL FK -> users(id)`
- `assigned_department_id uuid NULL FK -> departments(id)`
- `assigned_by_user_id uuid NOT NULL FK -> users(id)`
- `created_by_user_id uuid NOT NULL FK -> users(id)`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Klucze/ograniczenia:
- CHECK spójności przypisania:
  - gdy `assigned_to_type='user'` => `assigned_user_id IS NOT NULL AND assigned_department_id IS NULL`
  - gdy `assigned_to_type='department'` => `assigned_department_id IS NOT NULL AND assigned_user_id IS NULL`

---

### 1.8 `task_assignments` (historia przypisań)
- `id bigserial PK`
- `task_id uuid NOT NULL FK -> tasks(id)`
- `assigned_to_type assigned_to_type NOT NULL`
- `assigned_user_id uuid NULL FK -> users(id)`
- `assigned_department_id uuid NULL FK -> departments(id)`
- `assigned_by_user_id uuid NOT NULL FK -> users(id)`
- `assigned_at timestamptz NOT NULL DEFAULT now()`

Klucze/ograniczenia:
- CHECK jak w `tasks` dla spójności pól `assigned_*`
- Indeks `(task_id, assigned_at DESC)`

---

### 1.9 `plan_slots` (PARTITIONED BY RANGE na miesiąc po `lower(period)`)
- `id bigserial PK`
- `task_id uuid NOT NULL FK -> tasks(id)`
- `user_id uuid NOT NULL FK -> users(id)` (wykonawca slotu)
- `period tstzrange NOT NULL`
- `allow_overlap boolean NOT NULL DEFAULT false`
- `created_by_user_id uuid NOT NULL FK -> users(id)`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Klucze/ograniczenia:
- CHECK siatki 15': `is_quarter_hour_aligned(period)` (funkcja pomocnicza; długość > 0 i wielokrotność 15')
- EXCLUDE USING gist: `(user_id WITH =, period WITH &&)` WHERE `(allow_overlap = false)`
- Tabela partycjonowana: partycje miesięczne `plan_slots_YYYY_MM`

---

### 1.10 `time_logs` (PARTITIONED BY RANGE na miesiąc po `lower(period)`)
- `id bigserial PK`
- `task_id uuid NOT NULL FK -> tasks(id)`
- `user_id uuid NOT NULL FK -> users(id)` (autor/wykonawca pracy)
- `period tstzrange NOT NULL`
- `created_by_user_id uuid NOT NULL FK -> users(id)`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Klucze/ograniczenia:
- Trigger zaokrąglający `period` do siatki 15' (początek/koniec)
- CHECK minimalnej długości > 0 i wielokrotności 15'
- Blokada UPDATE/DELETE, gdy `upper(period) < now() - interval '7 days'` (trigger + RLS)
- Tabela partycjonowana: partycje miesięczne `time_logs_YYYY_MM`

---

### 1.11 `manager_audit_logs`
- `id bigserial PK`
- `actor_user_id uuid NOT NULL FK -> users(id)`
- `action manager_action NOT NULL`
- `target_table text NOT NULL`
- `target_pk text NOT NULL` (serializowany klucz docelowy)
- `change_summary jsonb NOT NULL DEFAULT '{}'::jsonb`
- `occurred_at timestamptz NOT NULL DEFAULT now()`

Klucze/ograniczenia:
- Indeksy wg sekcji 3
- Wstawienia tylko z triggerów (brak bezpośrednich INSERT dla zwykłych ról)

---

### 1.12 `events` (PARTITIONED BY RANGE na miesiąc po `occurred_at`)
- `id bigserial PK`
- `user_id uuid NOT NULL FK -> users(id)`
- `event_type event_type NOT NULL`
- `occurred_at timestamptz NOT NULL DEFAULT now()`
- `props jsonb NOT NULL DEFAULT '{}'::jsonb`

Klucze/ograniczenia:
- Unikalność `daily_active_update` 1×/dzień/użytkownik (indeks częściowy – sekcja 3)
- Tabela partycjonowana: partycje miesięczne `events_YYYY_MM`

---

### 1.13 Widoki i zmaterializowane widoki
- Widok `tasks_public` – maskowanie opisu prywatnych zadań:
  - Kolumny jak w `tasks`, z `description` zmaskowanym do `NULL` (lub tekstu polityki) dla rekordów `is_private = true` poza właścicielem (`assigned_user_id`) i jego menedżerami działu.
  - Dostęp SELECT dla ról nieuprzywilejowanych.
- MV `metrics_daily_user` – dzienne agregaty per użytkownik:
  - Kolumny: `user_id`, `date`, `plan_minutes` (bez overlap), `logged_minutes`, `plan_filled_percent`, `daily_active_update boolean`.
- MV `metrics_manager_view` – agregaty dla `manager_view_time`:
  - Kolumny: `date`, `manager_user_id`, `avg_ms`, `p90_ms`, `count`.
- Widok `task_overrun_flags` – logi >150% estymacji:
  - Kolumny: `task_id`, `assignee`, `estimate_minutes`, `logged_minutes`, `overrun_percent` (WHERE `logged_minutes > 1.5 * estimate_minutes`).

---

## 2. Relacje między tabelami
- `users` 1‑N `memberships`, 1‑N `plan_slots`, 1‑N `time_logs`, 1‑N `events`, 1‑N `manager_audit_logs`, 1‑N (twórcy/przypisujący) w `tasks` i `task_assignments`.
- `departments` 1‑N `memberships`; N‑N z `users` przez `department_managers`; N‑N read‑only przez `manager_cross_views`.
- `memberships(user_id, department_id, period)` utrzymuje historię i wyłączność przynależności.
- `tasks` N‑1 do `users` lub `departments` przez `assigned_*` (mutual‑exclusive); 1‑N do `task_assignments`, `plan_slots`, `time_logs`.
- `plan_slots(task_id, user_id, period)` wskazuje wykonawcę slotu.
- `time_logs(task_id, user_id, period)` wskazuje rzeczywisty czas pracy.

Kardynalności:
- `users` – `memberships`: 1‑N
- `departments` – `memberships`: 1‑N
- `users` – `department_managers`: N‑N (łącznik)
- `users` – `manager_cross_views`: N‑N (łącznik)
- `tasks` – `task_assignments`: 1‑N
- `tasks` – `plan_slots`: 1‑N
- `tasks` – `time_logs`: 1‑N

---

## 3. Indeksy

### 3.1 Ogólne
- `users(email)` UNIQUE (citext)
- `departments(name)` UNIQUE
- `memberships`
  - GiST EXCLUDE `(user_id WITH =, period WITH &&)`
  - BTREE `(user_id)`
  - BTREE `(department_id)`
  - BTREE `((upper(period)))` (do filtrów aktywnych/przyszłych)
- `user_working_hours`
  - PK `(user_id, weekday)`
- `tasks`
  - BTREE `(status)`
  - BTREE `(priority)`
  - Częściowy: BTREE `(assigned_user_id)` WHERE `assigned_to_type='user'`
  - Częściowy: BTREE `(assigned_department_id)` WHERE `assigned_to_type='department'`
  - Częściowy: BTREE `(status)` WHERE `status IN ('todo','in_progress')`
  - BTREE `(created_by_user_id)`
  - BTREE `(assigned_by_user_id)`
- `task_assignments`
  - BTREE `(task_id, assigned_at DESC)`
- `plan_slots` (na tabeli nadrzędnej – szablon dla partycji)
  - GiST `(period)`
  - BTREE `(user_id, (lower(period)))`
  - BTREE `(task_id, (lower(period)))`
- `time_logs` (na tabeli nadrzędnej – szablon dla partycji)
  - BTREE `(user_id, (lower(period)))`
  - BTREE `(task_id, (lower(period)))`
  - (opcjonalnie) GiST `(period)` do zapytań zakresowych
- `manager_audit_logs`
  - BTREE `(occurred_at DESC)`
  - BTREE `(actor_user_id, occurred_at DESC)`
- `events`
  - BTREE `(user_id, occurred_at DESC)`
  - Częściowy unikalny: UNIQUE on `(user_id, (occurred_at AT TIME ZONE 'UTC')::date)` WHERE `event_type='daily_active_update'`

### 3.2 Partycje
- Dla każdej partycji miesięcznej (`YYYY_MM`) powielić indeksy lokalne jak powyżej (szczególnie BTREE na `(user_id, lower(period))`, `(task_id, lower(period))` oraz GiST `period`).

---

## 4. Zasady PostgreSQL (RLS) – szkic polityk

Uwaga: Implementacja RLS zakłada funkcje pomocnicze zwracające `uuid` bieżącego użytkownika i rolę aplikacyjną, np. `current_app_user_id()` oraz `current_app_role()`.

### 4.1 `users`
- ENABLE RLS
- Admin: `USING true`
- Manager: `USING (id IN (SELECT user_id FROM memberships m JOIN department_managers dm ON dm.department_id = m.department_id WHERE dm.manager_user_id = current_app_user_id() AND m.period @> current_date) OR id = current_app_user_id())`
- Employee: `USING (id = current_app_user_id() OR id IN (SELECT m2.user_id FROM memberships m1 JOIN memberships m2 ON m1.department_id = m2.department_id WHERE m1.user_id = current_app_user_id() AND m1.period @> current_date AND m2.period @> current_date))`

### 4.2 `departments`
- ENABLE RLS
- Select dla wszystkich aktywnych użytkowników: `USING true`
- Modyfikacje: tylko admin i managerowie (INSERT/UPDATE/DELETE przez role)

### 4.3 `memberships`
- ENABLE RLS
- Select: użytkownicy mogą widzieć rekordy działów, w których aktualnie są (`m.user_id = current_app_user_id() OR EXISTS (SELECT 1 FROM memberships m2 WHERE m2.user_id = current_app_user_id() AND m2.department_id = m.department_id AND m2.period @> current_date)`)
- Insert/Update/Delete: tylko admin oraz manager działu (`EXISTS (SELECT 1 FROM department_managers dm WHERE dm.department_id = memberships.department_id AND dm.manager_user_id = current_app_user_id())`)

### 4.4 `department_managers` i `manager_cross_views`
- ENABLE RLS
- Select: manager widzi swoje rekordy; admin widzi wszystkie
- Mutacje: tylko admin

### 4.5 `tasks` i widok `tasks_public`
- Surowa tabela `tasks`: RLS surowszy (pełne dane)
  - ENABLE RLS
  - Admin: pełen dostęp
  - Manager: pełny dostęp do zadań przypisanych do użytkowników/działów, którymi zarządza; dodatkowo SELECT do działów z `manager_cross_views`
  - Employee: pełny dostęp do własnych zadań (gdy `assigned_to_type='user' AND assigned_user_id = current_app_user_id()`), SELECT dla zadań przypisanych do jego działu (gdy `assigned_to_type='department'` i członkostwo aktywne)
- Widok `tasks_public`: grant SELECT dla wszystkich; `description` zmaskowany przy `is_private = true` i braku uprawnień (nie właściciel/manager działu)

### 4.6 `task_assignments`
- ENABLE RLS
- Select: jak dla `tasks` (po JOIN do `tasks`)
- Insert: admin/manager; pracownik dla własnych zadań jeśli regulamin na to zezwala (opcjonalnie)

### 4.7 `plan_slots`
- ENABLE RLS
- Select: użytkownik widzi swoje sloty i sloty współdziałowców (ten sam dział w `memberships` bieżący) oraz manager widzi sloty swoich działów; manager z `manager_cross_views` – tylko SELECT
- Insert/Update/Delete: 
  - Employee: na własnych slotach (`user_id = current_app_user_id()`)
  - Manager: na slotach użytkowników działów, którymi zarządza

### 4.8 `time_logs`
- ENABLE RLS
- Select: użytkownik widzi własne logi; manager widzi logi swoich działów; admin wszystkie
- Insert: użytkownik może wstawiać własne logi
- Update/Delete: dozwolone wyłącznie, gdy `upper(period) >= now() - interval '7 days'` oraz `user_id = current_app_user_id()`; managerowie mogą korygować w działach w tym samym oknie czasu (opcjonalnie)

### 4.9 `manager_audit_logs`
- ENABLE RLS
- Select: admin i managerowie
- Insert: tylko triggery (role systemowe)

### 4.10 `events`
- ENABLE RLS
- Select: admin (całość), manager (agregaty/analityka – opcjonalnie per dział przez widoki), użytkownik – własne zdarzenia
- Insert: aplikacja w imieniu użytkownika
- Unikalność `daily_active_update`: wymuszona indeksem częściowym

---

## 5. Dodatkowe uwagi i decyzje projektowe

- Siatka 15 minut:
  - Funkcja `is_quarter_hour_aligned(period tstzrange)` sprawdza: `lower(period)` i `upper(period)` na granicach 15' oraz `upper(period) > lower(period)` i `((extract(epoch from (upper(period)-lower(period))) / 60) % 15 = 0)`.
  - Triggery na `plan_slots` i `time_logs` mogą dodatkowo normalizować do siatki 15'.
- DST i strefy:
  - Wszystkie wartości czasowe w UTC. Render i kalkulacje „minuty dnia” po stronie aplikacji wg `users.timezone`.
- Partycjonowanie:
  - Rodzic (`plan_slots`, `time_logs`, `events`) bez danych użytkowych. Partycje miesięczne tworzone automatycznie (cron/migracje), np. `FOR VALUES FROM ('2025-10-01') TO ('2025-11-01')`.
  - Indeksy tworzone per partycja zgodnie z sekcją 3.
- Raporty CSV:
  - Widoki raportowe (np. `report_daily`, `report_monthly`) oparte na `time_logs` (rzeczywisty czas) z JOIN do `tasks`, `departments`, `users`.
- Flagi >150% estymacji:
  - Widok `task_overrun_flags` łączy `time_logs` (SUM długości) z `tasks.estimate_minutes` i filtruje `> 150%`.
- Audyt menedżerski:
  - Triggery na `tasks`, `task_assignments`, `plan_slots`, `time_logs` wykrywają zmiany wykonywane przez użytkowników o roli `manager` i zapisują zdarzenia do `manager_audit_logs` wraz z `change_summary` (przed/po lub delta).
- Spójność danych:
  - ON DELETE/UPDATE
    - `users`: RESTRICT na kluczowych relacjach; `created_by_user_id`/`assigned_by_user_id` – `SET NULL` niezalecane, preferowane RESTRICT (lub `NO ACTION`) i kasowanie kaskadowe wyłącznie, gdy biznesowo zasadne.
    - `departments`: RESTRICT usunięcie, jeśli posiada `memberships`/`tasks`.
  - Migracje powinny jasno zdefiniować działania kaskadowe.
- Wydajność widoku planu (p90 < 2 s):
  - Zapytania wąsko okienkowane (np. tydzień/dzień per użytkownik), indeksy `(user_id, lower(period))`, unikanie szerokich JOINów, cache aplikacyjny dla list zadań i słowników.
- Bezpieczeństwo:
  - Granty: tabele bazowe – ograniczone; dla większości użytkowników SELECT przez widoki (`tasks_public`, raportowe, metryki). Mutacje przez funkcje/endpointy serwerowe z kontrolą ról.

---

## Załącznik: sugerowane szkice DDL (fragmenty)

```sql
-- Rozszerzenia
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS citext;

-- ENUMy (przykład)
CREATE TYPE app_role AS ENUM ('employee','manager','admin');
CREATE TYPE task_status AS ENUM ('todo','in_progress','blocked','done');
CREATE TYPE task_priority AS ENUM ('low','medium','high');
CREATE TYPE assigned_to_type AS ENUM ('user','department');
CREATE TYPE manager_action AS ENUM (
  'create_task','update_task','delete_task','assign_task','reassign_task',
  'plan_slot_create','plan_slot_update','plan_slot_delete',
  'time_log_create','time_log_update','time_log_delete'
);
CREATE TYPE event_type AS ENUM (
  'daily_active_update','manager_view_open','manager_view_render',
  'time_log_created','time_log_updated',
  'plan_slot_created','plan_slot_updated',
  'task_created','task_updated','task_closed'
);

-- Przykład constraints spójności w tasks
ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_ck CHECK (
  (assigned_to_type = 'user' AND assigned_user_id IS NOT NULL AND assigned_department_id IS NULL) OR
  (assigned_to_type = 'department' AND assigned_department_id IS NOT NULL AND assigned_user_id IS NULL)
);

-- Unikalność daily_active_update 1x/dzień/użytkownik
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS events_daily_active_unique
ON events (user_id, ((occurred_at AT TIME ZONE 'UTC')::date))
WHERE event_type = 'daily_active_update';

-- EXCLUDE bez overlapa slotów (gdy allow_overlap = false)
ALTER TABLE plan_slots ADD CONSTRAINT plan_slots_no_overlap_excl EXCLUDE USING gist (
  user_id WITH =,
  period WITH &&
) WHERE (allow_overlap = false);
```
