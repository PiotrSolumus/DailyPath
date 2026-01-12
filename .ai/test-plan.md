# Plan testów dla projektu DailyPath

## 1. Cel testów

### 1.1 Główne cele
- Weryfikacja zgodności z wymaganiami MVP
- Zapewnienie jakości funkcjonalnej i niefunkcjonalnej
- Weryfikacja bezpieczeństwa i autoryzacji
- Potwierdzenie dostępności (accessibility)
- Weryfikacja wydajności i responsywności
- Zapewnienie stabilności przed wdrożeniem produkcyjnym

### 1.2 Cele szczegółowe
- Weryfikacja wszystkich funkcjonalności zgodnie z PRD
- Testowanie autoryzacji opartej na rolach (Employee, Manager, Admin)
- Weryfikacja RLS policies w bazie danych
- Testowanie integracji z Supabase Auth
- Weryfikacja obsługi błędów i edge cases
- Testowanie responsywności na różnych urządzeniach
- Weryfikacja dostępności dla użytkowników z niepełnosprawnościami

## 2. Zakres testów

### 2.1 W zakresie testów

#### 2.1.1 Funkcjonalność podstawowa
- Autentykacja i autoryzacja (logowanie, wylogowanie, reset hasła, zaproszenia)
- Zarządzanie zadaniami (CRUD, filtrowanie, przypisania, prywatność)
- Planowanie w kalendarzu (tworzenie slotów, drag & drop, konflikty, widoki)
- Logowanie czasu (tworzenie, edycja, walidacja, flagi)
- Raporty (generowanie, filtrowanie, eksport CSV)
- Zarządzanie zespołem (przegląd planów, członkowie działu)
- Panel administracyjny (użytkownicy, działy, uprawnienia)
- Onboarding (wizard, konfiguracja preferencji)

#### 2.1.2 Bezpieczeństwo
- Autoryzacja oparta na rolach
- RLS policies w bazie danych
- Walidacja danych wejściowych
- Rate limiting
- Ochrona przed SQL injection
- Ochrona przed XSS
- Bezpieczeństwo sesji i cookies

#### 2.1.3 Wydajność
- Czasy ładowania stron (< 2s p90)
- Czasy odpowiedzi API (< 500ms p90)
- Optymalizacja zapytań do bazy danych
- Zarządzanie pamięcią (brak memory leaks)
- Renderowanie dużych list zadań

#### 2.1.4 Dostępność (Accessibility)
- Nawigacja klawiaturą
- Kompatybilność ze screen readerami
- Kontrast kolorów (WCAG 2.1 AA)
- Rozmiary elementów interaktywnych (min 44x44px)
- Semantyka HTML

#### 2.1.5 Responsywność
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024, 1024x768)
- Mobile (375x667, 414x896)
- Orientacja landscape/portrait

#### 2.1.6 Kompatybilność przeglądarek
- Chrome (najnowsza wersja)
- Firefox (najnowsza wersja)
- Safari (najnowsza wersja)
- Edge (najnowsza wersja)

### 2.2 Poza zakresem testów (MVP)
- Integracje zewnętrzne (Outlook, Google Calendar, Slack, Teams)
- Zaawansowane powiadomienia i przypomnienia
- Zaawansowane dashboardy KPI
- Pełna historia zmian/versioning
- Automatyczne planowanie
- Aplikacje mobilne natywne
- Wielojęzyczność UI
- Zaawansowane uprawnienia poza Employee/Manager/Admin

## 3. Strategia testowania

### 3.1 Piramida testów

```
        /\
       /E2E\          (10%) - Testy end-to-end
      /------\
     /Integr.\        (30%) - Testy integracyjne
    /---------\
   /   Unit    \      (60%) - Testy jednostkowe
  /-------------\
```

### 3.2 Typy testów

#### 3.2.1 Testy jednostkowe (Unit Tests)
- Narzędzie: Vitest lub Jest
- Zakres:
  - Funkcje utility (`lib/utils/*`)
  - Serwisy (`lib/services/*`)
  - Komponenty React (logika, hooks)
  - Schematy walidacji Zod
  - Funkcje pomocnicze (ETA calculator, time utils)
- Cel pokrycia: minimum 70% kodu

#### 3.2.2 Testy integracyjne (Integration Tests)
- Narzędzie: Vitest + Supabase Test Containers
- Zakres:
  - API endpoints (`src/pages/api/*`)
  - Integracja z bazą danych (RLS policies)
  - Integracja z Supabase Auth
  - Serwisy z bazą danych
- Cel: weryfikacja przepływu danych między warstwami

#### 3.2.3 Testy end-to-end (E2E Tests)
- Narzędzie: Playwright lub Cypress
- Zakres:
  - Pełne flow użytkownika (logowanie → tworzenie zadania → planowanie → logowanie czasu)
  - Flow menedżera (przegląd planów zespołu, przypisywanie zadań)
  - Flow administratora (zarządzanie użytkownikami, działami)
  - Onboarding wizard
- Cel: weryfikacja działania systemu z perspektywy użytkownika

#### 3.2.4 Testy bezpieczeństwa (Security Tests)
- Narzędzie: OWASP ZAP, manual testing
- Zakres:
  - Autoryzacja (próby dostępu bez uprawnień)
  - RLS policies (weryfikacja filtrowania danych)
  - Walidacja danych wejściowych
  - Rate limiting
  - XSS i SQL injection
- Cel: identyfikacja luk bezpieczeństwa

#### 3.2.5 Testy wydajnościowe (Performance Tests)
- Narzędzie: Lighthouse, Chrome DevTools, k6
- Zakres:
  - Czasy ładowania stron
  - Czasy odpowiedzi API
  - Optymalizacja zapytań SQL
  - Memory leaks
  - Renderowanie dużych list
- Cel: spełnienie wymagań wydajnościowych (p90 < 2s)

#### 3.2.6 Testy dostępności (Accessibility Tests)
- Narzędzie: axe DevTools, WAVE, manual testing
- Zakres:
  - WCAG 2.1 AA compliance
  - Nawigacja klawiaturą
  - Screen reader compatibility
  - Kontrast kolorów
- Cel: dostępność dla wszystkich użytkowników

#### 3.2.7 Testy manualne (Manual Testing)
- Zakres:
  - Testy eksploracyjne
  - Testy UX
  - Testy edge cases
  - Weryfikacja zgodności z designem
- Cel: weryfikacja subiektywnych aspektów jakości

## 4. Środowisko testowe

### 4.1 Wymagania sprzętowe
- Procesor: minimum 4 rdzenie
- RAM: minimum 8GB (16GB zalecane)
- Dysk: minimum 20GB wolnego miejsca
- System operacyjny: Windows 10/11, macOS, Linux

### 4.2 Wymagania oprogramowania
- Node.js 22.14.0 (zgodnie z `.nvmrc`)
- npm (bundled z Node.js)
- Docker Desktop (dla Supabase local)
- Git

### 4.3 Narzędzia testowe

#### 4.3.1 Frameworki testowe
- Vitest — testy jednostkowe i integracyjne
- Playwright — testy E2E
- Testing Library — testy komponentów React

#### 4.3.2 Narzędzia pomocnicze
- Supabase CLI — zarządzanie lokalną bazą danych
- Lighthouse — audyt wydajności i dostępności
- axe DevTools — testy dostępności
- Chrome DevTools — debugging i profiling
- Postman/Thunder Client — testowanie API

#### 4.3.3 Narzędzia CI/CD
- GitHub Actions (lub alternatywa)
- Docker — konteneryzacja środowiska testowego

### 4.4 Konfiguracja środowiska

#### 4.4.1 Środowisko lokalne
```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie Supabase lokalnie
npx supabase start

# 3. Zastosowanie migracji
npx supabase migration up

# 4. Seed danych testowych
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql

# 5. Uruchomienie serwera deweloperskiego
npm run dev

# 6. Uruchomienie testów
npm run test
```

#### 4.4.2 Środowisko testowe (staging)
- Osobna instancja Supabase (staging)
- Osobna domena (np. `staging.dailypath.com`)
- Dane testowe (nie produkcyjne)
- Monitoring i logowanie

### 4.5 Dane testowe
- 6 użytkowników testowych (admin, 2 managers, 3 employees)
- 3 działy (Engineering, Product, Marketing)
- 7+ zadań testowych (różne statusy, priorytety, prywatność)
- Plan slots dla testów ETA
- Time logs dla testów raportów

## 5. Przypadki testowe

### 5.1 Moduł: Autentykacja i autoryzacja

#### TC-AUTH-001: Logowanie użytkownika
- Priorytet: Krytyczny
- Typ: E2E, Integration
- Preconditions: Użytkownik istnieje w bazie danych
- Kroki:
  1. Otwórz `/login`
  2. Wprowadź poprawny email i hasło
  3. Kliknij "Zaloguj się"
- Oczekiwany rezultat:
  - Użytkownik zostaje zalogowany
  - Przekierowanie do `/dashboard`
  - Sesja jest utworzona (cookie)
  - Brak błędów w konsoli
- Kryteria akceptacji: ✅ Użytkownik może zalogować się i uzyskać dostęp do aplikacji

#### TC-AUTH-002: Logowanie z nieprawidłowymi danymi
- Priorytet: Wysoki
- Typ: Unit, Integration
- Kroki:
  1. Otwórz `/login`
  2. Wprowadź nieprawidłowy email lub hasło
  3. Kliknij "Zaloguj się"
- Oczekiwany rezultat:
  - Komunikat błędu: "Nieprawidłowy email lub hasło"
  - Użytkownik nie jest zalogowany
  - Brak przekierowania
- Kryteria akceptacji: ✅ System poprawnie waliduje dane i wyświetla komunikat błędu

#### TC-AUTH-003: Rate limiting przy logowaniu
- Priorytet: Średni
- Typ: Integration, Security
- Kroki:
  1. Wykonaj 10 nieudanych prób logowania w ciągu 1 minuty
  2. Spróbuj zalogować się ponownie
- Oczekiwany rezultat:
  - Po 5 nieudanych próbach: komunikat o rate limiting
  - Status HTTP 429
  - Blokada na 5 minut
- Kryteria akceptacji: ✅ System chroni przed brute force attacks

#### TC-AUTH-004: Wylogowanie użytkownika
- Priorytet: Wysoki
- Typ: E2E
- Kroki:
  1. Zaloguj się jako użytkownik
  2. Kliknij "Wyloguj" w menu
  3. Potwierdź wylogowanie
- Oczekiwany rezultat:
  - Sesja jest zniszczona
  - Przekierowanie do `/login`
  - Cookie sesji jest usunięte
- Kryteria akceptacji: ✅ Użytkownik może bezpiecznie wylogować się z systemu

#### TC-AUTH-005: Reset hasła
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. Otwórz `/reset-password`
  2. Wprowadź email
  3. Kliknij "Wyślij link resetujący"
  4. Otwórz email i kliknij link
  5. Wprowadź nowe hasło
- Oczekiwany rezultat:
  - Email z linkiem resetującym jest wysłany
  - Link jest ważny przez 1 godzinę
  - Hasło zostaje zmienione
  - Można zalogować się nowym hasłem
- Kryteria akceptacji: ✅ Użytkownik może zresetować hasło przez email

#### TC-AUTH-006: Autoryzacja oparta na rolach - Employee
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Użytkownik z rolą Employee jest zalogowany
- Kroki:
  1. Spróbuj uzyskać dostęp do `/admin`
  2. Spróbuj utworzyć użytkownika przez API
  3. Spróbuj zaplanować dzień innego użytkownika
- Oczekiwany rezultat:
  - Dostęp do `/admin` jest zablokowany (403)
  - Tworzenie użytkownika jest zablokowane (403)
  - Planowanie dla innych jest zablokowane (403)
- Kryteria akceptacji: ✅ Employee ma tylko uprawnienia zgodne z rolą

#### TC-AUTH-007: Autoryzacja oparta na rolach - Manager
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Użytkownik z rolą Manager jest zalogowany
- Kroki:
  1. Spróbuj uzyskać dostęp do `/admin`
  2. Spróbuj zaplanować dzień pracownika z zarządzanego działu
  3. Spróbuj utworzyć zadanie dla działu
- Oczekiwany rezultat:
  - Dostęp do `/admin` jest zablokowany (403)
  - Planowanie dla pracowników działu jest dozwolone (200)
  - Tworzenie zadań dla działu jest dozwolone (200)
- Kryteria akceptacji: ✅ Manager ma uprawnienia zgodne z rolą

#### TC-AUTH-008: Autoryzacja oparta na rolach - Admin
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Użytkownik z rolą Admin jest zalogowany
- Kroki:
  1. Otwórz `/admin`
  2. Utwórz nowego użytkownika
  3. Utwórz nowy dział
  4. Przypisz użytkownika do działu
- Oczekiwany rezultat:
  - Wszystkie operacje są dozwolone (200)
  - Admin ma pełny dostęp do wszystkich funkcji
- Kryteria akceptacji: ✅ Admin ma pełne uprawnienia

#### TC-AUTH-009: Zaproszenie użytkownika
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Manager lub Admin jest zalogowany
- Kroki:
  1. Przejdź do `/admin` (Admin) lub użyj API (Manager)
  2. Kliknij "Zaproś użytkownika"
  3. Wprowadź email, rolę, dział
  4. Kliknij "Wyślij zaproszenie"
- Oczekiwany rezultat:
  - Zaproszenie jest utworzone w bazie danych
  - Token jest wygenerowany
  - Email z linkiem zaproszenia jest wysłany (symulacja)
  - Token wygasa po 7 dniach
- Kryteria akceptacji: ✅ Manager/Admin może zaprosić nowego użytkownika

#### TC-AUTH-010: Rejestracja przez zaproszenie
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Zaproszenie zostało wysłane
- Kroki:
  1. Otwórz link z zaproszenia
  2. Wypełnij formularz rejestracji (email, hasło, imię)
  3. Kliknij "Zarejestruj się"
- Oczekiwany rezultat:
  - Użytkownik jest utworzony w `auth.users` i `public.users`
  - Zaproszenie jest oznaczone jako zaakceptowane
  - Użytkownik jest przypisany do działu
  - Można zalogować się nowym kontem
- Kryteria akceptacji: ✅ Użytkownik może zarejestrować się przez zaproszenie

### 5.2 Moduł: Zarządzanie zadaniami

#### TC-TASK-001: Tworzenie zadania
- Priorytet: Krytyczny
- Typ: E2E, Integration
- Kroki:
  1. Zaloguj się jako użytkownik
  2. Przejdź do `/tasks`
  3. Kliknij "Nowe zadanie"
  4. Wypełnij formularz (tytuł, opis, priorytet, estymacja, data docelowa)
  5. Kliknij "Utwórz zadanie"
- Oczekiwany rezultat:
  - Zadanie jest utworzone w bazie danych
  - Zadanie pojawia się na liście
  - Toast notification: "Zadanie zostało utworzone"
  - `created_by_user_id` = zalogowany użytkownik
- Kryteria akceptacji: ✅ Użytkownik może utworzyć zadanie z poprawnymi danymi

#### TC-TASK-002: Walidacja przy tworzeniu zadania
- Priorytet: Wysoki
- Typ: Unit, Integration
- Kroki:
  1. Przejdź do `/tasks`
  2. Kliknij "Nowe zadanie"
  3. Zostaw pole "Nazwa" puste
  4. Ustaw estymację na 10 (mniej niż 15)
  5. Ustaw estymację na 20 (nie wielokrotność 15)
  6. Spróbuj utworzyć zadanie
- Oczekiwany rezultat:
  - Browser validation blokuje submit
  - Komunikaty błędów są wyświetlane
  - Zadanie nie jest utworzone
- Kryteria akceptacji: ✅ System waliduje dane przed utworzeniem zadania

#### TC-TASK-003: Edycja zadania
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Zadanie istnieje w bazie danych
- Kroki:
  1. Przejdź do `/tasks`
  2. Kliknij na zadanie
  3. Kliknij "Edytuj"
  4. Zmień tytuł, priorytet, status
  5. Kliknij "Zapisz"
- Oczekiwany rezultat:
  - Zadanie jest zaktualizowane w bazie danych
  - Zmiany są widoczne na liście
  - Toast notification: "Zadanie zostało zaktualizowane"
- Kryteria akceptacji: ✅ Użytkownik może edytować zadanie

#### TC-TASK-004: Usuwanie zadania
- Priorytet: Średni
- Typ: E2E, Integration
- Preconditions: Zadanie istnieje w bazie danych
- Kroki:
  1. Przejdź do `/tasks`
  2. Kliknij na zadanie
  3. Kliknij "Usuń"
  4. Potwierdź usunięcie
- Oczekiwany rezultat:
  - Zadanie jest usunięte z bazy danych
  - Zadanie znika z listy
  - Toast notification: "Zadanie zostało usunięte"
- Kryteria akceptacji: ✅ Użytkownik może usunąć zadanie

#### TC-TASK-005: Filtrowanie zadań po statusie
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Istnieją zadania z różnymi statusami
- Kroki:
  1. Przejdź do `/tasks`
  2. Wybierz z filtra Status: "Do zrobienia"
- Oczekiwany rezultat:
  - URL zmienia się na `/tasks?status=todo`
  - Lista pokazuje tylko zadania ze statusem "todo"
  - Request do API zawiera parametr `status=todo`
- Kryteria akceptacji: ✅ Filtrowanie po statusie działa poprawnie

#### TC-TASK-006: Filtrowanie zadań po priorytecie
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. Przejdź do `/tasks`
  2. Wybierz z filtra Priorytet: "Wysoki"
- Oczekiwany rezultat:
  - URL zawiera `priority=high`
  - Lista pokazuje tylko zadania z priorytetem "high"
- Kryteria akceptacji: ✅ Filtrowanie po priorytecie działa poprawnie

#### TC-TASK-007: Kombinacja wielu filtrów
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. Przejdź do `/tasks`
  2. Ustaw filtry: Status="W trakcie", Priorytet="Wysoki", Widoczność="Publiczne"
- Oczekiwany rezultat:
  - URL zawiera wszystkie parametry: `?status=in_progress&priority=high&is_private=false`
  - Lista filtruje się po wszystkich kryteriach (AND logic)
- Kryteria akceptacji: ✅ Wiele filtrów działa jednocześnie

#### TC-TASK-008: Privacy masking - właściciel widzi pełny opis
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Zadanie prywatne należy do zalogowanego użytkownika
- Kroki:
  1. Zaloguj się jako właściciel zadania prywatnego
  2. Przejdź do `/tasks`
  3. Znajdź zadanie prywatne
- Oczekiwany rezultat:
  - Badge "Prywatne" jest widoczny
  - Pełny opis zadania jest widoczny
  - Wszystkie szczegóły są dostępne
- Kryteria akceptacji: ✅ Właściciel widzi pełny opis zadania prywatnego

#### TC-TASK-009: Privacy masking - inny użytkownik widzi zamaskowany opis
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Zadanie prywatne należy do innego użytkownika (ten sam dział)
- Kroki:
  1. Zaloguj się jako inny użytkownik z tego samego działu
  2. Przejdź do `/tasks`
  3. Znajdź zadanie prywatne innego użytkownika
- Oczekiwany rezultat:
  - Zadanie jest widoczne (jeśli przypisane do działu)
  - Badge "Prywatne" jest widoczny
  - Opis pokazuje "[Szczegóły prywatne]" (zamaskowany)
- Kryteria akceptacji: ✅ Inny użytkownik nie widzi opisu prywatnego zadania

#### TC-TASK-010: Privacy masking - Manager widzi pełny opis podwładnego
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Manager zarządza działem, Employee ma zadanie prywatne
- Kroki:
  1. Zaloguj się jako Manager działu
  2. Przejdź do `/tasks`
  3. Znajdź zadanie prywatne podwładnego
- Oczekiwany rezultat:
  - Zadanie jest widoczne
  - Badge "Prywatne" jest widoczny
  - Pełny opis jest widoczny (Manager ma dostęp)
- Kryteria akceptacji: ✅ Manager widzi pełny opis prywatnych zadań podwładnych

#### TC-TASK-011: Wyświetlanie ETA gdy 100% zaplanowane
- Priorytet: Wysoki
- Typ: Integration, Unit
- Preconditions: Zadanie ma estymację 120 min, zaplanowano 120 min w plan_slots
- Kroki:
  1. Przejdź do `/tasks`
  2. Znajdź zadanie z 100% zaplanowaną estymacją
- Oczekiwany rezultat:
  - Pole "ETA" jest widoczne
  - ETA pokazuje datę końca ostatniego slotu
  - Tekst ETA jest zielony
- Kryteria akceptacji: ✅ ETA jest wyświetlane gdy 100% estymacji jest zaplanowane

#### TC-TASK-012: Brak ETA gdy mniej niż 100% zaplanowane
- Priorytet: Wysoki
- Typ: Integration, Unit
- Preconditions: Zadanie ma estymację 120 min, zaplanowano 60 min
- Kroki:
  1. Przejdź do `/tasks`
  2. Znajdź zadanie z <100% zaplanowaną estymacją
- Oczekiwany rezultat:
  - Pole "ETA" nie jest widoczne
  - Widoczna tylko estymacja i ewentualnie due_date
- Kryteria akceptacji: ✅ ETA nie jest wyświetlane gdy <100% zaplanowane

#### TC-TASK-013: RLS - Employee widzi tylko swoje zadania
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Employee jest zalogowany, istnieją zadania innych użytkowników
- Kroki:
  1. Zaloguj się jako Employee
  2. Przejdź do `/tasks`
  3. Sprawdź listę zadań
- Oczekiwany rezultat:
  - Widoczne tylko zadania przypisane do Employee
  - Widoczne zadania przypisane do działu Employee
  - Nie widać zadań innych użytkowników z innych działów
  - API zwraca tylko dozwolone zadania (RLS filtruje)
- Kryteria akceptacji: ✅ RLS poprawnie filtruje zadania dla Employee

#### TC-TASK-014: RLS - Manager widzi zadania działu
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Manager zarządza działem, istnieją zadania pracowników działu
- Kroki:
  1. Zaloguj się jako Manager
  2. Przejdź do `/tasks`
  3. Sprawdź listę zadań
- Oczekiwany rezultat:
  - Widoczne własne zadania
  - Widoczne zadania wszystkich pracowników zarządzanego działu
  - Widoczne zadania przypisane do działu
  - Nie widać zadań z innych działów (chyba że ma cross-view)
- Kryteria akceptacji: ✅ RLS poprawnie filtruje zadania dla Manager

#### TC-TASK-015: RLS - Admin widzi wszystkie zadania
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Admin jest zalogowany
- Kroki:
  1. Zaloguj się jako Admin
  2. Przejdź do `/tasks`
  3. Sprawdź listę zadań
- Oczekiwany rezultat:
  - Widoczne wszystkie zadania w systemie
  - Liczba zadań odpowiada `SELECT COUNT(*) FROM tasks`
- Kryteria akceptacji: ✅ Admin ma pełny dostęp do wszystkich zadań

### 5.3 Moduł: Planowanie (Calendar)

#### TC-PLAN-001: Wyświetlanie kalendarza w widoku dzień
- Priorytet: Krytyczny
- Typ: E2E, Unit
- Kroki:
  1. Zaloguj się jako użytkownik
  2. Przejdź do `/plan`
  3. Wybierz widok "Dzień"
- Oczekiwany rezultat:
  - Kalendarz pokazuje jeden dzień
  - Sloty 15-minutowe są widoczne (24/7)
  - Godziny są wyświetlane (00:00 - 23:45)
  - Istniejące plan_slots są widoczne
- Kryteria akceptacji: ✅ Widok dzień wyświetla się poprawnie

#### TC-PLAN-002: Wyświetlanie kalendarza w widoku tydzień
- Priorytet: Krytyczny
- Typ: E2E, Unit
- Kroki:
  1. Przejdź do `/plan`
  2. Wybierz widok "Tydzień"
- Oczekiwany rezultat:
  - Kalendarz pokazuje 7 dni
  - Sloty 15-minutowe są widoczne dla każdego dnia
  - Istniejące plan_slots są widoczne
- Kryteria akceptacji: ✅ Widok tydzień wyświetla się poprawnie

#### TC-PLAN-003: Tworzenie plan_slot przez drag & drop
- Priorytet: Krytyczny
- Typ: E2E, Integration
- Preconditions: Zadanie istnieje w bazie danych
- Kroki:
  1. Przejdź do `/plan`
  2. Przeciągnij zadanie z listy na slot czasowy
  3. Upuść zadanie na slot
- Oczekiwany rezultat:
  - Plan_slot jest utworzony w bazie danych
  - Slot jest wizualnie oznaczony jako zajęty
  - Zadanie jest widoczne w kalendarzu
  - Toast notification: "Zadanie zostało zaplanowane"
- Kryteria akceptacji: ✅ Drag & drop tworzy plan_slot

#### TC-PLAN-004: Przenoszenie plan_slot przez drag & drop
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Plan_slot istnieje w kalendarzu
- Kroki:
  1. Przejdź do `/plan`
  2. Przeciągnij istniejący slot na inny czas
  3. Upuść slot
- Oczekiwany rezultat:
  - Plan_slot jest zaktualizowany w bazie danych
  - Slot jest przeniesiony na nowy czas
  - Toast notification: "Plan został zaktualizowany"
- Kryteria akceptacji: ✅ Drag & drop przenosi plan_slot

#### TC-PLAN-005: Wykrywanie konfliktu czasowego
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Istnieje plan_slot w danym czasie
- Kroki:
  1. Przejdź do `/plan`
  2. Spróbuj przeciągnąć zadanie na slot, który jest już zajęty
- Oczekiwany rezultat:
  - Modal potwierdzenia pojawia się
  - Komunikat: "Wykryto konflikt czasowy. Czy chcesz dopuścić overlap?"
  - Opcje: "Anuluj", "Dopuść overlap"
- Kryteria akceptacji: ✅ System wykrywa konflikty czasowe

#### TC-PLAN-006: Świadome dopuszczenie overlapa
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Wykryto konflikt czasowy
- Kroki:
  1. Po wykryciu konfliktu, kliknij "Dopuść overlap"
  2. Potwierdź utworzenie slotu z overlapem
- Oczekiwany rezultat:
  - Plan_slot jest utworzony z `allow_overlap = true`
  - Slot jest wizualnie oznaczony jako overlap (np. czerwona ramka)
  - Oba sloty są widoczne w kalendarzu
- Kryteria akceptacji: ✅ Użytkownik może świadomie dopuścić overlap

#### TC-PLAN-007: Nawigacja klawiaturą w kalendarzu
- Priorytet: Wysoki
- Typ: E2E, Accessibility
- Kroki:
  1. Przejdź do `/plan`
  2. Użyj klawiatury do nawigacji (Tab, strzałki)
  3. Użyj Enter/Space do wyboru slotu
- Oczekiwany rezultat:
  - Wszystkie elementy są dostępne przez klawiaturę
  - Focus jest widoczny
  - Screen reader ogłasza elementy
- Kryteria akceptacji: ✅ Kalendarz jest dostępny przez klawiaturę

#### TC-PLAN-008: Manager planuje dzień pracownika
- Priorytet: Krytyczny
- Typ: E2E, Integration, Security
- Preconditions: Manager zarządza działem, Employee należy do działu
- Kroki:
  1. Zaloguj się jako Manager
  2. Przejdź do `/team`
  3. Kliknij na pracownika
  4. Wybierz "Zobacz plan"
  5. Utwórz plan_slot dla pracownika
- Oczekiwany rezultat:
  - Plan_slot jest utworzony z `user_id` = pracownik
  - Slot jest widoczny w planie pracownika
  - Employee widzi slot w swoim planie
- Kryteria akceptacji: ✅ Manager może planować dzień pracowników działu

#### TC-PLAN-009: Employee nie może planować dla innych
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Employee jest zalogowany
- Kroki:
  1. Spróbuj utworzyć plan_slot z `user_id` innego użytkownika przez API
- Oczekiwany rezultat:
  - API zwraca 403 Forbidden
  - Plan_slot nie jest utworzony
- Kryteria akceptacji: ✅ Employee nie może planować dla innych

#### TC-PLAN-010: Zaokrąglanie slotów do 15 minut
- Priorytet: Wysoki
- Typ: Unit, Integration
- Kroki:
  1. Spróbuj utworzyć slot z czasem niebędącym wielokrotnością 15 min (np. 10:07-10:22)
- Oczekiwany rezultat:
  - Slot jest automatycznie zaokrąglony do 10:00-10:15 lub 10:15-10:30
  - Baza danych waliduje alignment (trigger)
- Kryteria akceptacji: ✅ Wszystkie sloty są wyrównane do 15 minut

### 5.4 Moduł: Logowanie czasu

#### TC-TIME-001: Tworzenie time_log
- Priorytet: Krytyczny
- Typ: E2E, Integration
- Preconditions: Zadanie istnieje w bazie danych
- Kroki:
  1. Przejdź do `/time-logs`
  2. Kliknij "Dodaj log czasu"
  3. Wybierz zadanie, datę, czas rozpoczęcia i zakończenia
  4. Kliknij "Zapisz"
- Oczekiwany rezultat:
  - Time_log jest utworzony w bazie danych
  - Czas jest zaokrąglony do 15 minut
  - Log pojawia się na liście
  - Toast notification: "Log czasu został dodany"
- Kryteria akceptacji: ✅ Użytkownik może utworzyć log czasu

#### TC-TIME-002: Zaokrąglanie czasu do 15 minut
- Priorytet: Wysoki
- Typ: Unit, Integration
- Kroki:
  1. Utwórz time_log z czasem 10:07-10:22
- Oczekiwany rezultat:
  - Czas jest zaokrąglony do 10:00-10:15 lub 10:15-10:30
  - Trigger w bazie danych normalizuje period
- Kryteria akceptacji: ✅ Wszystkie logi czasu są zaokrąglone do 15 minut

#### TC-TIME-003: Edycja time_log (do 7 dni wstecz)
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Time_log został utworzony 3 dni temu
- Kroki:
  1. Przejdź do `/time-logs`
  2. Znajdź log z 3 dni temu
  3. Kliknij "Edytuj"
  4. Zmień czas
  5. Kliknij "Zapisz"
- Oczekiwany rezultat:
  - Time_log jest zaktualizowany
  - Zmiany są widoczne na liście
- Kryteria akceptacji: ✅ Użytkownik może edytować logi do 7 dni wstecz

#### TC-TIME-004: Blokada edycji time_log starszego niż 7 dni
- Priorytet: Wysoki
- Typ: Integration, Security
- Preconditions: Time_log został utworzony 8 dni temu
- Kroki:
  1. Spróbuj edytować time_log starszy niż 7 dni
- Oczekiwany rezultat:
  - API zwraca błąd: "modifications to time_logs older than 7 days are not allowed"
  - Status HTTP 400 lub 403
  - Time_log nie jest zaktualizowany
- Kryteria akceptacji: ✅ System blokuje edycję logów starszych niż 7 dni

#### TC-TIME-005: Flaga dla logów >150% estymacji
- Priorytet: Średni
- Typ: Integration, Unit
- Preconditions: Zadanie ma estymację 60 min, time_log ma 90+ min
- Kroki:
  1. Utwórz time_log z czasem >150% estymacji
  2. Sprawdź raporty lub dashboard
- Oczekiwany rezultat:
  - Log jest oznaczony jako wymagający przeglądu
  - Manager widzi flagę w raportach
  - Dashboard pokazuje alert
- Kryteria akceptacji: ✅ System flaguje logi przekraczające 150% estymacji

#### TC-TIME-006: RLS - Employee widzi tylko swoje logi
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Employee jest zalogowany, istnieją logi innych użytkowników
- Kroki:
  1. Zaloguj się jako Employee
  2. Przejdź do `/time-logs`
  3. Sprawdź listę logów
- Oczekiwany rezultat:
  - Widoczne tylko własne time_logs
  - API zwraca tylko dozwolone logi (RLS filtruje)
- Kryteria akceptacji: ✅ RLS poprawnie filtruje time_logs dla Employee

#### TC-TIME-007: RLS - Manager widzi logi działu
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Manager zarządza działem
- Kroki:
  1. Zaloguj się jako Manager
  2. Przejdź do `/time-logs`
  3. Sprawdź listę logów
- Oczekiwany rezultat:
  - Widoczne własne logi
  - Widoczne logi pracowników zarządzanego działu
  - API zwraca tylko dozwolone logi (RLS filtruje)
- Kryteria akceptacji: ✅ RLS poprawnie filtruje time_logs dla Manager

### 5.5 Moduł: Raporty

#### TC-REPORT-001: Generowanie raportu dziennego
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Istnieją time_logs i plan_slots dla danego dnia
- Kroki:
  1. Zaloguj się jako Manager lub Admin
  2. Przejdź do `/reports`
  3. Wybierz typ: "Dzienny"
  4. Wybierz datę
  5. Kliknij "Generuj raport"
- Oczekiwany rezultat:
  - Raport jest wygenerowany
  - Zawiera: data, zadanie, dział, wykonawca, łączny czas, status przy zamknięciu
  - Dane są poprawne (zgodne z time_logs)
- Kryteria akceptacji: ✅ Raport dzienny jest generowany poprawnie

#### TC-REPORT-002: Filtrowanie raportu po dziale
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. Przejdź do `/reports`
  2. Wybierz dział z filtra
  3. Generuj raport
- Oczekiwany rezultat:
  - Raport zawiera tylko dane z wybranego działu
  - Dane są poprawne
- Kryteria akceptacji: ✅ Filtrowanie po dziale działa poprawnie

#### TC-REPORT-003: Filtrowanie raportu po użytkowniku
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. Przejdź do `/reports`
  2. Wybierz użytkownika z filtra
  3. Generuj raport
- Oczekiwany rezultat:
  - Raport zawiera tylko dane wybranego użytkownika
  - Dane są poprawne
- Kryteria akceptacji: ✅ Filtrowanie po użytkowniku działa poprawnie

#### TC-REPORT-004: Eksport raportu do CSV
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Raport został wygenerowany
- Kroki:
  1. Wygeneruj raport
  2. Kliknij "Eksportuj do CSV"
- Oczekiwany rezultat:
  - Plik CSV jest pobierany
  - Plik zawiera wszystkie dane z raportu
  - Format CSV jest poprawny (separator, encoding)
- Kryteria akceptacji: ✅ Eksport do CSV działa poprawnie

#### TC-REPORT-005: Raport miesięczny
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. Przejdź do `/reports`
  2. Wybierz typ: "Miesięczny"
  3. Wybierz miesiąc i rok
  4. Generuj raport
- Oczekiwany rezultat:
  - Raport jest wygenerowany dla całego miesiąca
  - Dane są zagregowane (suma czasu, liczba zadań)
  - Dane są poprawne
- Kryteria akceptacji: ✅ Raport miesięczny jest generowany poprawnie

#### TC-REPORT-006: Autoryzacja - Employee nie ma dostępu do raportów
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Employee jest zalogowany
- Kroki:
  1. Spróbuj uzyskać dostęp do `/reports`
  2. Spróbuj wygenerować raport przez API
- Oczekiwany rezultat:
  - Dostęp do `/reports` jest zablokowany (403 lub przekierowanie)
  - API zwraca 403 Forbidden
- Kryteria akceptacji: ✅ Employee nie ma dostępu do raportów

### 5.6 Moduł: Zarządzanie zespołem

#### TC-TEAM-001: Przegląd planów członków zespołu
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Manager zarządza działem, istnieją plan_slots pracowników
- Kroki:
  1. Zaloguj się jako Manager
  2. Przejdź do `/team`
  3. Kliknij na członka zespołu
  4. Wybierz "Zobacz plan"
- Oczekiwany rezultat:
  - Plan pracownika jest wyświetlony
  - Wszystkie plan_slots są widoczne
  - Można edytować plan (Manager)
- Kryteria akceptacji: ✅ Manager może przeglądać plany członków zespołu

#### TC-TEAM-002: Employee nie widzi planów innych
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Employee jest zalogowany
- Kroki:
  1. Spróbuj uzyskać dostęp do planu innego użytkownika przez API
- Oczekiwany rezultat:
  - API zwraca 403 Forbidden lub puste dane (RLS)
  - Plan nie jest wyświetlony
- Kryteria akceptacji: ✅ Employee nie ma dostępu do planów innych

### 5.7 Moduł: Panel administracyjny

#### TC-ADMIN-001: Tworzenie użytkownika (Admin)
- Priorytet: Krytyczny
- Typ: E2E, Integration
- Preconditions: Admin jest zalogowany
- Kroki:
  1. Przejdź do `/admin`
  2. Kliknij "Dodaj użytkownika"
  3. Wypełnij formularz (email, imię, rola, hasło)
  4. Kliknij "Utwórz użytkownika"
- Oczekiwany rezultat:
  - Użytkownik jest utworzony w `auth.users` i `public.users`
  - Użytkownik może zalogować się od razu
  - Toast notification: "Użytkownik został utworzony"
- Kryteria akceptacji: ✅ Admin może utworzyć użytkownika

#### TC-ADMIN-002: Edycja użytkownika
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Użytkownik istnieje w bazie danych
- Kroki:
  1. Przejdź do `/admin`
  2. Kliknij na użytkownika
  3. Kliknij "Edytuj"
  4. Zmień rolę, status aktywny
  5. Kliknij "Zapisz"
- Oczekiwany rezultat:
  - Użytkownik jest zaktualizowany w bazie danych
  - Zmiany są widoczne na liście
- Kryteria akceptacji: ✅ Admin może edytować użytkownika

#### TC-ADMIN-003: Dezaktywacja użytkownika
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Użytkownik jest aktywny
- Kroki:
  1. Przejdź do `/admin`
  2. Kliknij na użytkownika
  3. Kliknij "Dezaktywuj"
  4. Potwierdź dezaktywację
- Oczekiwany rezultat:
  - `is_active = false` w bazie danych
  - Użytkownik nie może zalogować się
  - Użytkownik nie jest widoczny na liście (lub jest oznaczony jako nieaktywny)
- Kryteria akceptacji: ✅ Admin może dezaktywować użytkownika

#### TC-ADMIN-004: Tworzenie działu
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Admin jest zalogowany
- Kroki:
  1. Przejdź do `/admin`
  2. Kliknij "Dodaj dział"
  3. Wprowadź nazwę działu
  4. Kliknij "Utwórz dział"
- Oczekiwany rezultat:
  - Dział jest utworzony w bazie danych
  - Dział pojawia się na liście
  - Toast notification: "Dział został utworzony"
- Kryteria akceptacji: ✅ Admin może utworzyć dział

#### TC-ADMIN-005: Przypisanie użytkownika do działu
- Priorytet: Wysoki
- Typ: E2E, Integration
- Preconditions: Użytkownik i dział istnieją
- Kroki:
  1. Przejdź do `/admin`
  2. Kliknij na użytkownika
  3. Kliknij "Przypisz do działu"
  4. Wybierz dział
  5. Wybierz datę rozpoczęcia i zakończenia (opcjonalnie)
  6. Kliknij "Zapisz"
- Oczekiwany rezultat:
  - Membership jest utworzony w bazie danych
  - Użytkownik jest przypisany do działu
  - Membership jest widoczny w profilu użytkownika
- Kryteria akceptacji: ✅ Admin może przypisać użytkownika do działu

#### TC-ADMIN-006: Autoryzacja - Manager nie ma dostępu do /admin
- Priorytet: Krytyczny
- Typ: Integration, Security
- Preconditions: Manager jest zalogowany
- Kroki:
  1. Spróbuj uzyskać dostęp do `/admin`
- Oczekiwany rezultat:
  - Dostęp jest zablokowany (403 lub przekierowanie)
  - Komunikat: "Tylko administrator może uzyskać dostęp do tej strony"
- Kryteria akceptacji: ✅ Manager nie ma dostępu do panelu administracyjnego

### 5.8 Moduł: Onboarding

#### TC-ONBOARD-001: Uruchomienie wizarda onboarding
- Priorytet: Wysoki
- Typ: E2E
- Preconditions: Nowy użytkownik loguje się po raz pierwszy
- Kroki:
  1. Zaloguj się jako nowy użytkownik
  2. Sprawdź czy wizard się uruchamia
- Oczekiwany rezultat:
  - Wizard onboarding jest wyświetlony
  - Krok 1: Konfiguracja strefy czasowej
- Kryteria akceptacji: ✅ Wizard uruchamia się dla nowych użytkowników

#### TC-ONBOARD-002: Konfiguracja strefy czasowej
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. W wizardzie wybierz strefę czasową (np. "Europe/Warsaw")
  2. Kliknij "Dalej"
- Oczekiwany rezultat:
  - Strefa czasowa jest zapisana w profilu użytkownika
  - Przechodzisz do następnego kroku
- Kryteria akceptacji: ✅ Użytkownik może skonfigurować strefę czasową

#### TC-ONBOARD-003: Konfiguracja godzin pracy
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. W wizardzie wybierz dni tygodnia i godziny pracy
  2. Kliknij "Dalej"
- Oczekiwany rezultat:
  - Godziny pracy są zapisane w `user_working_hours`
  - Przechodzisz do następnego kroku
- Kryteria akceptacji: ✅ Użytkownik może skonfigurować godziny pracy

#### TC-ONBOARD-004: Zakończenie onboarding
- Priorytet: Wysoki
- Typ: E2E, Integration
- Kroki:
  1. Przejdź przez wszystkie kroki wizarda
  2. Kliknij "Zakończ"
- Oczekiwany rezultat:
  - Wizard się zamyka
  - Użytkownik jest przekierowany do `/dashboard`
  - Wizard nie uruchamia się ponownie
- Kryteria akceptacji: ✅ Użytkownik może zakończyć onboarding

### 5.9 Moduł: Wydajność

#### TC-PERF-001: Czas ładowania strony Tasks
- Priorytet: Wysoki
- Typ: Performance
- Preconditions: Istnieje 50+ zadań w bazie danych
- Kroki:
  1. Otwórz Chrome DevTools → Network tab
  2. Przejdź do `/tasks`
  3. Zmierz czas ładowania
- Oczekiwany rezultat:
  - Czas ładowania < 2000ms (p90)
  - Time to First Byte (TTFB) < 500ms
- Kryteria akceptacji: ✅ Strona Tasks ładuje się szybko

#### TC-PERF-002: Czas odpowiedzi API /api/tasks
- Priorytet: Wysoki
- Typ: Performance
- Preconditions: Istnieje 50+ zadań w bazie danych
- Kroki:
  1. Otwórz Chrome DevTools → Network tab
  2. Przejdź do `/tasks`
  3. Zmierz czas odpowiedzi API
- Oczekiwany rezultat:
  - Czas odpowiedzi < 500ms (p90)
  - Zapytanie SQL jest zoptymalizowane (używa indeksów)
- Kryteria akceptacji: ✅ API odpowiada szybko

#### TC-PERF-003: Renderowanie dużych list zadań
- Priorytet: Średni
- Typ: Performance
- Preconditions: Istnieje 100+ zadań w bazie danych
- Kroki:
  1. Przejdź do `/tasks`
  2. Sprawdź czas renderowania listy
  3. Sprawdź użycie pamięci (Chrome DevTools → Memory)
- Oczekiwany rezultat:
  - Lista renderuje się < 1000ms
  - Brak memory leaks
  - Scroll jest płynny (60 FPS)
- Kryteria akceptacji: ✅ Duże listy renderują się wydajnie

#### TC-PERF-004: Optymalizacja zapytań SQL
- Priorytet: Wysoki
- Typ: Performance
- Kroki:
  1. Uruchom `EXPLAIN ANALYZE` dla zapytań do `tasks`, `plan_slots`, `time_logs`
  2. Sprawdź użycie indeksów
- Oczekiwany rezultat:
  - Wszystkie zapytania używają indeksów
  - Brak sequential scans na dużych tabelach
  - Query time < 100ms dla typowych zapytań
- Kryteria akceptacji: ✅ Zapytania SQL są zoptymalizowane

### 5.10 Moduł: Dostępność (Accessibility)

#### TC-A11Y-001: Nawigacja klawiaturą
- Priorytet: Wysoki
- Typ: Accessibility, E2E
- Kroki:
  1. Otwórz aplikację
  2. Użyj tylko klawiatury (Tab, Enter, Space, strzałki)
  3. Przejdź przez wszystkie główne strony
- Oczekiwany rezultat:
  - Wszystkie elementy interaktywne są dostępne przez klawiaturę
  - Focus jest widoczny (outline)
  - Brak "focus trap"
- Kryteria akceptacji: ✅ Aplikacja jest w pełni dostępna przez klawiaturę

#### TC-A11Y-002: Kompatybilność ze screen readerem
- Priorytet: Wysoki
- Typ: Accessibility, Manual
- Narzędzie: NVDA (Windows) lub VoiceOver (macOS)
- Kroki:
  1. Włącz screen reader
  2. Przejdź przez aplikację
  3. Sprawdź czy wszystkie elementy są ogłaszane
- Oczekiwany rezultat:
  - Wszystkie elementy mają odpowiednie aria-labels
  - Formularze mają aria-describedby dla błędów
  - Modal ma aria-modal="true"
  - Buttons mają czytelne nazwy
- Kryteria akceptacji: ✅ Aplikacja jest kompatybilna ze screen readerami

#### TC-A11Y-003: Kontrast kolorów
- Priorytet: Wysoki
- Typ: Accessibility
- Narzędzie: axe DevTools, WAVE
- Kroki:
  1. Uruchom audyt dostępności (axe DevTools)
  2. Sprawdź kontrast wszystkich tekstów
- Oczekiwany rezultat:
  - Wszystkie teksty mają kontrast >= 4.5:1 (WCAG AA)
  - Teksty duże (18pt+) mają kontrast >= 3:1
  - Brak błędów kontrastu w raporcie
- Kryteria akceptacji: ✅ Kontrast kolorów spełnia WCAG 2.1 AA

#### TC-A11Y-004: Rozmiary elementów interaktywnych
- Priorytet: Średni
- Typ: Accessibility
- Kroki:
  1. Sprawdź rozmiary wszystkich przycisków, linków, inputów
- Oczekiwany rezultat:
  - Wszystkie elementy interaktywne mają min 44x44px
  - Touch targets są wystarczająco duże
- Kryteria akceptacji: ✅ Elementy interaktywne mają odpowiednie rozmiary

#### TC-A11Y-005: Semantyka HTML
- Priorytet: Średni
- Typ: Accessibility
- Narzędzie: WAVE, axe DevTools
- Kroki:
  1. Uruchom audyt dostępności
  2. Sprawdź semantykę HTML
- Oczekiwany rezultat:
  - Użycie semantycznych tagów (header, nav, main, footer, button, form)
  - Brak div-ów jako przyciski
  - Właściwe użycie headingów (h1-h6)
- Kryteria akceptacji: ✅ HTML jest semantyczny

### 5.11 Moduł: Responsywność

#### TC-RESP-001: Desktop (1920x1080)
- Priorytet: Wysoki
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację w rozdzielczości 1920x1080
  2. Przejdź przez wszystkie strony
- Oczekiwany rezultat:
  - Layout jest czytelny
  - Wszystkie elementy są widoczne
  - Brak horizontal scroll
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie na desktop

#### TC-RESP-002: Tablet (768x1024)
- Priorytet: Wysoki
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację w rozdzielczości 768x1024 (Chrome DevTools)
  2. Przejdź przez wszystkie strony
- Oczekiwany rezultat:
  - Layout dostosowuje się (grid: 2 kolumny)
  - Modal zajmuje większość ekranu
  - Touch targets >= 44x44px
  - Tekst jest czytelny
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie na tablecie

#### TC-RESP-003: Mobile (375x667)
- Priorytet: Wysoki
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację w rozdzielczości 375x667 (iPhone SE)
  2. Przejdź przez wszystkie strony
- Oczekiwany rezultat:
  - Layout dostosowuje się (grid: 1 kolumna)
  - Modal fullscreen lub prawie fullscreen
  - Wszystkie przyciski są łatwe do kliknięcia
  - Tekst jest czytelny (nie za mały)
  - Sidebar jest ukryty (hamburger menu)
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie na mobile

#### TC-RESP-004: Landscape mobile
- Priorytet: Średni
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację na mobile w orientacji landscape
  2. Przejdź przez wszystkie strony
- Oczekiwany rezultat:
  - Layout dostosowuje się
  - Modal nie wychodzi poza ekran
  - Można scrollować jeśli potrzeba
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie w landscape

### 5.12 Moduł: Kompatybilność przeglądarek

#### TC-BROWSER-001: Chrome
- Priorytet: Krytyczny
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację w Chrome (najnowsza wersja)
  2. Przejdź przez wszystkie główne funkcje
- Oczekiwany rezultat:
  - Wszystkie funkcje działają poprawnie
  - Brak błędów w konsoli
  - Stylowanie jest poprawne
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie w Chrome

#### TC-BROWSER-002: Firefox
- Priorytet: Wysoki
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację w Firefox (najnowsza wersja)
  2. Przejdź przez wszystkie główne funkcje
- Oczekiwany rezultat:
  - Wszystkie funkcje działają poprawnie
  - Brak błędów w konsoli
  - Stylowanie jest poprawne
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie w Firefox

#### TC-BROWSER-003: Safari
- Priorytet: Wysoki
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację w Safari (najnowsza wersja)
  2. Przejdź przez wszystkie główne funkcje
- Oczekiwany rezultat:
  - Wszystkie funkcje działają poprawnie
  - Brak błędów w konsoli
  - Stylowanie jest poprawne (uwaga na webkit-specific)
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie w Safari

#### TC-BROWSER-004: Edge
- Priorytet: Średni
- Typ: E2E, Manual
- Kroki:
  1. Otwórz aplikację w Edge (najnowsza wersja)
  2. Przejdź przez wszystkie główne funkcje
- Oczekiwany rezultat:
  - Wszystkie funkcje działają poprawnie
  - Brak błędów w konsoli
  - Stylowanie jest poprawne
- Kryteria akceptacji: ✅ Aplikacja działa poprawnie w Edge

### 5.13 Moduł: Bezpieczeństwo

#### TC-SEC-001: Ochrona przed SQL Injection
- Priorytet: Krytyczny
- Typ: Security
- Kroki:
  1. Spróbuj wprowadzić SQL injection w polach formularzy (np. `'; DROP TABLE users; --`)
  2. Sprawdź logi bazy danych
- Oczekiwany rezultat:
  - Dane są escapowane (parametryzowane queries)
  - Brak wykonania złośliwego SQL
  - Baza danych pozostaje nienaruszona
- Kryteria akceptacji: ✅ System jest chroniony przed SQL injection

#### TC-SEC-002: Ochrona przed XSS
- Priorytet: Krytyczny
- Typ: Security
- Kroki:
  1. Spróbuj wprowadzić XSS w polach formularzy (np. `<script>alert('XSS')</script>`)
  2. Sprawdź czy skrypt jest wykonany
- Oczekiwany rezultat:
  - Dane są escapowane (React automatycznie escape)
  - Skrypt nie jest wykonany
  - Tekst jest wyświetlany jako zwykły tekst
- Kryteria akceptacji: ✅ System jest chroniony przed XSS

#### TC-SEC-003: Walidacja danych wejściowych
- Priorytet: Wysoki
- Typ: Security, Integration
- Kroki:
  1. Spróbuj wysłać nieprawidłowe dane przez API (np. ujemne liczby, bardzo długie stringi)
- Oczekiwany rezultat:
  - Zod schemas walidują dane
  - API zwraca 400 Bad Request z komunikatami błędów
  - Nieprawidłowe dane nie są zapisane w bazie
- Kryteria akceptacji: ✅ System waliduje wszystkie dane wejściowe

#### TC-SEC-004: Rate limiting
- Priorytet: Wysoki
- Typ: Security, Integration
- Kroki:
  1. Wykonaj wiele requestów w krótkim czasie (np. 100 requestów/sekundę)
- Oczekiwany rezultat:
  - Rate limiting jest aktywny
  - Po przekroczeniu limitu: status 429
  - Komunikat: "Zbyt wiele żądań. Spróbuj ponownie za chwilę."
- Kryteria akceptacji: ✅ System chroni przed nadużyciami (rate limiting)

#### TC-SEC-005: Bezpieczeństwo sesji
- Priorytet: Krytyczny
- Typ: Security
- Kroki:
  1. Zaloguj się
  2. Sprawdź cookies (HttpOnly, Secure, SameSite)
  3. Spróbuj użyć starego tokena po wylogowaniu
- Oczekiwany rezultat:
  - Cookies mają flagi: HttpOnly, Secure (w produkcji), SameSite=Strict
  - Stary token nie działa po wylogowaniu
  - Sesja wygasa po określonym czasie
- Kryteria akceptacji: ✅ Sesje są bezpieczne

#### TC-SEC-006: RLS policies - próba dostępu do cudzych danych
- Priorytet: Krytyczny
- Typ: Security, Integration
- Preconditions: Employee A i Employee B istnieją, Employee A ma zadania
- Kroki:
  1. Zaloguj się jako Employee A
  2. Uzyskaj ID zadania Employee A
  3. Wyloguj się
  4. Zaloguj się jako Employee B
  5. Spróbuj uzyskać dostęp do zadania Employee A przez API
- Oczekiwany rezultat:
  - API zwraca 403 Forbidden lub 404 Not Found
  - RLS blokuje dostęp
  - Zadanie nie jest zwrócone
- Kryteria akceptacji: ✅ RLS poprawnie blokuje dostęp do cudzych danych

## 6. Kryteria akceptacji

### 6.1 Kryteria funkcjonalne
- ✅ Wszystkie funkcje z PRD są zaimplementowane i działają poprawnie
- ✅ Wszystkie przypadki testowe z priorytetem "Krytyczny" przechodzą (100%)
- ✅ Wszystkie przypadki testowe z priorytetem "Wysoki" przechodzą (≥95%)
- ✅ Wszystkie przypadki testowe z priorytetem "Średni" przechodzą (≥80%)

### 6.2 Kryteria bezpieczeństwa
- ✅ Wszystkie testy bezpieczeństwa przechodzą (100%)
- ✅ RLS policies są aktywne i działają poprawnie
- ✅ Autoryzacja oparta na rolach działa poprawnie
- ✅ Brak znanych luk bezpieczeństwa (OWASP Top 10)

### 6.3 Kryteria wydajnościowe
- ✅ Czas ładowania stron < 2000ms (p90)
- ✅ Czas odpowiedzi API < 500ms (p90)
- ✅ Lighthouse Performance Score ≥ 80
- ✅ Brak memory leaks

### 6.4 Kryteria dostępności
- ✅ WCAG 2.1 AA compliance (axe DevTools: 0 błędów)
- ✅ Nawigacja klawiaturą działa w 100%
- ✅ Kompatybilność ze screen readerami (NVDA/VoiceOver)
- ✅ Kontrast kolorów ≥ 4.5:1

### 6.5 Kryteria jakości kodu
- ✅ Test coverage ≥ 70% (unit + integration)
- ✅ Brak błędów lintera (ESLint)
- ✅ Brak błędów TypeScript
- ✅ Wszystkie testy automatyczne przechodzą

### 6.6 Kryteria kompatybilności
- ✅ Aplikacja działa w Chrome, Firefox, Safari, Edge (najnowsze wersje)
- ✅ Aplikacja działa na desktop, tablet, mobile
- ✅ Responsywność jest poprawna na wszystkich rozdzielczościach

## 7. Harmonogram

### 7.1 Faza 1: Przygotowanie (Tydzień 1)
- **Cel**: Przygotowanie środowiska testowego i infrastruktury
- **Zadania**:
  - Konfiguracja środowiska testowego
  - Instalacja narzędzi testowych (Vitest, Playwright)
  - Przygotowanie danych testowych
  - Konfiguracja CI/CD dla testów
- **Rezultat**: Środowisko testowe gotowe do użycia

### 7.2 Faza 2: Testy jednostkowe (Tydzień 2-3)
- **Cel**: Pokrycie kodu testami jednostkowymi
- **Zakres**:
  - Utility functions (`lib/utils/*`)
  - Services (`lib/services/*`)
  - Komponenty React (logika)
  - Schematy walidacji Zod
- **Cel pokrycia**: 70%
- **Rezultat**: Testy jednostkowe dla wszystkich modułów

### 7.3 Faza 3: Testy integracyjne (Tydzień 4-5)
- **Cel**: Weryfikacja integracji między warstwami
- **Zakres**:
  - API endpoints
  - Integracja z bazą danych (RLS)
  - Integracja z Supabase Auth
- **Rezultat**: Testy integracyjne dla wszystkich API

### 7.4 Faza 4: Testy E2E (Tydzień 6-7)
- **Cel**: Weryfikacja pełnych flow użytkownika
- **Zakres**:
  - Flow logowania/rejestracji
  - Flow tworzenia i zarządzania zadaniami
  - Flow planowania
  - Flow logowania czasu
  - Flow raportów
  - Flow administracyjny
- **Rezultat**: Testy E2E dla wszystkich głównych flow

### 7.5 Faza 5: Testy bezpieczeństwa (Tydzień 8)
- **Cel**: Weryfikacja bezpieczeństwa aplikacji
- **Zakres**:
  - Autoryzacja i RLS
  - Ochrona przed SQL injection, XSS
  - Rate limiting
  - Bezpieczeństwo sesji
- **Rezultat**: Raport bezpieczeństwa, lista znalezionych problemów

### 7.6 Faza 6: Testy wydajnościowe (Tydzień 9)
- **Cel**: Weryfikacja wydajności aplikacji
- **Zakres**:
  - Czasy ładowania stron
  - Czasy odpowiedzi API
  - Optymalizacja zapytań SQL
  - Memory leaks
- **Rezultat**: Raport wydajności, rekomendacje optymalizacji

### 7.7 Faza 7: Testy dostępności (Tydzień 10)
- **Cel**: Weryfikacja dostępności aplikacji
- **Zakres**:
  - WCAG 2.1 AA compliance
  - Nawigacja klawiaturą
  - Screen reader compatibility
  - Kontrast kolorów
- **Rezultat**: Raport dostępności, lista problemów do naprawy

### 7.8 Faza 8: Testy manualne i eksploracyjne (Tydzień 11)
- **Cel**: Weryfikacja subiektywnych aspektów jakości
- **Zakres**:
  - Testy eksploracyjne
  - Testy UX
  - Testy edge cases
  - Weryfikacja zgodności z designem
- **Rezultat**: Lista znalezionych problemów UX/UI

### 7.9 Faza 9: Testy regresyjne (Tydzień 12)
- **Cel**: Weryfikacja że naprawione błędy nie powróciły
- **Zakres**:
  - Wszystkie testy krytyczne i wysokie
  - Testy dla naprawionych funkcji
- **Rezultat**: Potwierdzenie że wszystkie błędy są naprawione

### 7.10 Faza 10: Finalizacja (Tydzień 13)
- **Cel**: Przygotowanie do release
- **Zadania**:
  - Finalne testy regresyjne
  - Dokumentacja testów
  - Raport końcowy
  - Sign-off od stakeholders
- **Rezultat**: Aplikacja gotowa do release

## 8. Zasoby

### 8.1 Zespół testowy
- **Test Lead** (1 osoba) - koordynacja, planowanie, raportowanie
- **Testerzy automatyczni** (2 osoby) - testy jednostkowe, integracyjne, E2E
- **Testerzy manualni** (2 osoby) - testy manualne, eksploracyjne, UX
- **Tester bezpieczeństwa** (1 osoba) - testy bezpieczeństwa, penetration testing
- **Tester dostępności** (1 osoba) - testy dostępności, WCAG compliance

### 8.2 Narzędzia i infrastruktura
- **Frameworki testowe**: Vitest, Playwright, Testing Library
- **Narzędzia bezpieczeństwa**: OWASP ZAP, Burp Suite
- **Narzędzia dostępności**: axe DevTools, WAVE, NVDA, VoiceOver
- **Narzędzia wydajnościowe**: Lighthouse, Chrome DevTools, k6
- **CI/CD**: GitHub Actions (lub alternatywa)
- **Środowisko testowe**: Docker, Supabase Local

### 8.3 Budżet
- **Narzędzia**: $0 (open source)
- **Infrastruktura**: $0 (lokalne środowisko)
- **Czas zespołu**: 13 tygodni × 7 osób = 91 tygodni roboczych

## 9. Ryzyka

### 9.1 Ryzyka techniczne

#### RYZ-001: Brak infrastruktury testowej
- **Prawdopodobieństwo**: Średnie
- **Wpływ**: Wysoki
- **Mitigacja**:
  - Wczesne przygotowanie środowiska testowego
  - Dokumentacja setupu
  - Backup plan (cloud environment)

#### RYZ-002: Niska jakość danych testowych
- **Prawdopodobieństwo**: Średnie
- **Wpływ**: Średni
- **Mitigacja**:
  - Przygotowanie kompleksowych danych testowych (seed.sql)
  - Automatyczne generowanie danych testowych
  - Weryfikacja danych przed testami

#### RYZ-003: Problemy z wydajnością bazy danych
- **Prawdopodobieństwo**: Niskie
- **Wpływ**: Wysoki
- **Mitigacja**:
  - Wczesne testy wydajnościowe
  - Optymalizacja zapytań SQL
  - Monitoring zapytań

### 9.2 Ryzyka organizacyjne

#### RYZ-004: Brak dostępności zespołu
- **Prawdopodobieństwo**: Średnie
- **Wpływ**: Wysoki
- **Mitigacja**:
  - Wczesne zaplanowanie zasobów
  - Backup testerzy
  - Elastyczny harmonogram

#### RYZ-005: Zmiany w wymaganiach
- **Prawdopodobieństwo**: Średnie
- **Wpływ**: Średni
- **Mitigacja**:
  - Elastyczny plan testów
  - Priorytetyzacja przypadków testowych
  - Komunikacja z product ownerem

### 9.3 Ryzyka związane z jakością

#### RYZ-006: Niska jakość kodu źródłowego
- **Prawdopodobieństwo**: Niskie
- **Wpływ**: Wysoki
- **Mitigacja**:
  - Code review przed testami
  - Wczesne testy jednostkowe
  - Refactoring przed testami integracyjnymi

#### RYZ-007: Brak dokumentacji
- **Prawdopodobieństwo**: Niskie
- **Wpływ**: Średni
- **Mitigacja**:
  - Dokumentacja na bieżąco
  - Code comments
  - API documentation

## 10. Metryki i raportowanie

### 10.1 Metryki testowe
- **Test Coverage**: ≥70% (unit + integration)
- **Pass Rate**: ≥95% dla testów krytycznych i wysokich
- **Defect Density**: <5 defektów na 1000 linii kodu
- **Defect Leakage**: <2% (defekty znalezione w produkcji)

### 10.2 Raportowanie
- **Raporty tygodniowe**: Postęp testów, znalezione defekty, metryki
- **Raporty fazowe**: Podsumowanie każdej fazy, rekomendacje
- **Raport końcowy**: Podsumowanie wszystkich testów, metryki końcowe, sign-off

### 10.3 Narzędzia raportowania
- **Test Management**: GitHub Issues, Jira (lub alternatywa)
- **Defect Tracking**: GitHub Issues
- **Test Metrics**: Custom dashboard, Excel

## 11. Załączniki

### 11.1 Lista przypadków testowych (pełna)
- Excel/CSV z wszystkimi przypadkami testowymi
- ID, nazwa, priorytet, typ, kroki, oczekiwany rezultat

### 11.2 Dane testowe
- `supabase/seed.sql` - seed data dla bazy danych
- Konta testowe (email, hasło, rola)
- Scenariusze testowe

### 11.3 Dokumentacja techniczna
- API documentation
- Database schema
- Architecture diagrams

---

**Wersja dokumentu**: 1.0  
**Data utworzenia**: 2026-01-08  
**Autor**: Software Testing Specialist  
**Status**: Draft → Do zatwierdzenia
