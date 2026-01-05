# Manual Testing Guide - Widok Tasks

## 🎯 Cel dokumentu

Ten dokument zawiera szczegółowe instrukcje testowania manualnego dla widoku Tasks w aplikacji DailyPath. Testy powinny być wykonane przed każdym release oraz po wprowadzeniu zmian w komponentach Tasks.

---

## 🔐 Przygotowanie środowiska testowego

### Wymagania
- Uruchomiona aplikacja: `npm run dev`
- Uruchomiona baza danych Supabase: `supabase start`
- Przeglądarki: Chrome, Firefox, Safari (opcjonalnie)
- Dane testowe w bazie (użytkownicy z różnymi rolami)

### Konta testowe

Upewnij się, że masz dostęp do kont z różnymi rolami:

1. **Admin** - widzi wszystkie zadania
   - Email: admin@example.com
   - Rola: admin

2. **Manager** - widzi zadania swojego działu
   - Email: manager@example.com
   - Rola: manager
   - Dział: Engineering

3. **Employee** - widzi tylko swoje zadania
   - Email: employee@example.com
   - Rola: employee
   - Dział: Engineering

### Seed danych testowych

Uruchom skrypt seedowania:
```bash
npm run seed
```

Lub użyj skryptu tworzenia użytkowników testowych:
```bash
node scripts/create-test-users.js
```

---

## 🧪 Testy krytycznych flowów

### Flow 1: Przeglądanie listy zadań

#### Cel
Sprawdzenie czy użytkownik może przeglądać listę zadań zgodnie z uprawnieniami (RLS).

#### Kroki testowe

**Test 1.1: Employee widzi tylko swoje zadania**

1. Zaloguj się jako employee@example.com
2. Przejdź do `/tasks`
3. **Oczekiwany rezultat:**
   - Widoczne tylko zadania przypisane do zalogowanego użytkownika
   - Widoczne zadania przypisane do działu użytkownika (jeśli `assigned_to_type = 'department'`)
   - Nie widać zadań innych użytkowników z innych działów
4. **Weryfikacja:**
   - Sprawdź w konsoli deweloperskiej Network tab → request do `/api/tasks`
   - Response powinien zawierać tylko dozwolone zadania (RLS filtruje na backendzie)

**Test 1.2: Manager widzi zadania swojego działu**

1. Zaloguj się jako manager@example.com
2. Przejdź do `/tasks`
3. **Oczekiwany rezultat:**
   - Widoczne własne zadania
   - Widoczne zadania wszystkich użytkowników w zarządzanym dziale
   - Widoczne zadania przypisane do działu
   - Nie widać zadań z innych działów (chyba że ma `manager_cross_views`)
4. **Weryfikacja:**
   - Porównaj liczbę zadań z bazą danych (query ręczny z RLS)
   - Sprawdź czy widać zadania podwładnych

**Test 1.3: Admin widzi wszystkie zadania**

1. Zaloguj się jako admin@example.com
2. Przejdź do `/tasks`
3. **Oczekiwany rezultat:**
   - Widoczne wszystkie zadania w systemie (bez filtrowania RLS)
4. **Weryfikacja:**
   - Liczba zadań powinna odpowiadać `SELECT COUNT(*) FROM tasks`

**Test 1.4: Wyświetlanie pustej listy**

1. Zaloguj się jako nowy użytkownik bez zadań
2. Przejdź do `/tasks`
3. **Oczekiwany rezultat:**
   - Komunikat "Brak zadań do wyświetlenia"
   - Brak błędów w konsoli
   - Filtry są nadal widoczne i działają

---

### Flow 2: Filtrowanie zadań

#### Cel
Sprawdzenie czy filtrowanie działa poprawnie i synchronizuje się z URL.

#### Kroki testowe

**Test 2.1: Filtrowanie po statusie**

1. Zaloguj się jako użytkownik z wieloma zadaniami
2. Przejdź do `/tasks`
3. Wybierz z filtra Status: "Do zrobienia"
4. **Oczekiwany rezultat:**
   - URL zmienia się na `/tasks?status=todo`
   - Lista zadań filtruje się automatycznie
   - Widoczne tylko zadania ze statusem "todo"
   - Loading spinner pojawia się na chwilę podczas refetch
5. **Weryfikacja:**
   - Sprawdź Network tab - nowy request do `/api/tasks?status=todo`
   - Wszystkie wyświetlone zadania mają status "todo"

**Test 2.2: Filtrowanie po priorytecie**

1. Wybierz z filtra Priorytet: "Wysoki"
2. **Oczekiwany rezultat:**
   - URL: `/tasks?status=todo&priority=high` (jeśli poprzedni filtr był aktywny)
   - Lista filtruje się po obu kryteriach
   - Widoczne tylko zadania: status=todo AND priority=high

**Test 2.3: Filtrowanie po widoczności (prywatne/publiczne)**

1. Wybierz z filtra Widoczność: "Prywatne"
2. **Oczekiwany rezultat:**
   - URL: `/tasks?is_private=true`
   - Widoczne tylko zadania prywatne
   - Zadania prywatne innych użytkowników mają zamaskowany opis "[Szczegóły prywatne]"

**Test 2.4: Kombinacja wielu filtrów**

1. Ustaw:
   - Status: "W trakcie"
   - Priorytet: "Wysoki"
   - Widoczność: "Publiczne"
2. **Oczekiwany rezultat:**
   - URL: `/tasks?status=in_progress&priority=high&is_private=false`
   - Lista filtruje się po wszystkich kryteriach (AND logic)

**Test 2.5: Czyszczenie filtrów**

1. Ustaw kilka filtrów (status, priorytet)
2. Kliknij przycisk "Wyczyść"
3. **Oczekiwany rezultat:**
   - Przycisk "Wyczyść" znika
   - URL wraca do `/tasks` (bez query params)
   - Lista pokazuje wszystkie dostępne zadania
   - Wszystkie selecty wracają do "Wszystkie"

**Test 2.6: Synchronizacja URL (bookmark/share)**

1. Ustaw filtry: status=todo, priority=high
2. Skopiuj URL: `/tasks?status=todo&priority=high`
3. Otwórz nową kartę i wklej URL
4. **Oczekiwany rezultat:**
   - Strona ładuje się z filtrami już zastosowanymi
   - Selecty pokazują wybrane wartości
   - Lista jest przefiltrowana

**Test 2.7: Browser back/forward**

1. Wejdź na `/tasks`
2. Ustaw filtr: status=todo
3. Ustaw filtr: priority=high
4. Kliknij browser back (←)
5. **Oczekiwany rezultat:**
   - URL wraca do `/tasks?status=todo`
   - Lista filtruje się tylko po status
   - Select priorytetu wraca do "Wszystkie"
6. Kliknij browser forward (→)
7. **Oczekiwany rezultat:**
   - URL wraca do `/tasks?status=todo&priority=high`
   - Oba filtry są aktywne

---

### Flow 3: Tworzenie nowego zadania

#### Cel
Sprawdzenie czy użytkownik może utworzyć zadanie z walidacją i obsługą błędów.

#### Kroki testowe

**Test 3.1: Utworzenie zadania z poprawnymi danymi**

1. Zaloguj się jako dowolny użytkownik
2. Przejdź do `/tasks`
3. Kliknij "Nowe zadanie"
4. **Oczekiwany rezultat:**
   - Modal się otwiera
   - Focus jest na polu "Nazwa"
5. Wypełnij formularz:
   - Nazwa: "Test task"
   - Opis: "Test description"
   - Priorytet: "Wysoki"
   - Estymacja: 60
   - Data docelowa: jutrzejsza data
   - Zadanie prywatne: zaznacz checkbox
6. Kliknij "Utwórz zadanie"
7. **Oczekiwany rezultat:**
   - Toast notification: "Zadanie zostało utworzone"
   - Modal się zamyka
   - Lista zadań się odświeża automatycznie
   - Nowe zadanie pojawia się na liście (jeśli pasuje do filtrów)
8. **Weryfikacja:**
   - Sprawdź Network tab - POST do `/api/tasks` z status 201
   - Sprawdź w bazie danych czy zadanie zostało utworzone
   - Sprawdź czy `created_by_user_id` to zalogowany użytkownik

**Test 3.2: Walidacja wymaganych pól**

1. Kliknij "Nowe zadanie"
2. Zostaw pole "Nazwa" puste
3. Kliknij "Utwórz zadanie"
4. **Oczekiwany rezultat:**
   - Browser native validation: tooltip "Please fill out this field"
   - Formularz nie jest submitowany
   - Focus wraca do pola "Nazwa"

**Test 3.3: Walidacja estymacji (minimum 15, wielokrotność 15)**

1. Kliknij "Nowe zadanie"
2. Wypełnij "Nazwa": "Test"
3. Ustaw "Estymacja": 10 (mniej niż 15)
4. Kliknij "Utwórz zadanie"
5. **Oczekiwany rezultat:**
   - Browser validation: "Value must be greater than or equal to 15"
   - Formularz nie jest submitowany

6. Ustaw "Estymacja": 20 (nie wielokrotność 15)
7. Kliknij "Utwórz zadanie"
8. **Oczekiwany rezultat:**
   - Browser validation: "Please enter a valid value"
   - Formularz nie jest submitowany

9. Ustaw "Estymacja": 30 (poprawna wartość)
10. Kliknij "Utwórz zadanie"
11. **Oczekiwany rezultat:**
    - Zadanie zostaje utworzone (walidacja przeszła)

**Test 3.4: Anulowanie tworzenia zadania**

1. Kliknij "Nowe zadanie"
2. Wypełnij część formularza
3. Kliknij "Anuluj"
4. **Oczekiwany rezultat:**
   - Modal się zamyka
   - Dane nie są zapisane
   - Lista zadań nie zmienia się

5. Kliknij "Nowe zadanie" ponownie
6. Naciśnij Escape
7. **Oczekiwany rezultat:**
   - Modal się zamyka (keyboard shortcut działa)

**Test 3.5: Obsługa błędów API**

1. Kliknij "Nowe zadanie"
2. Wypełnij formularz poprawnie
3. Symuluj błąd API (np. wyłącz internet lub użyj DevTools → Network → Offline)
4. Kliknij "Utwórz zadanie"
5. **Oczekiwany rezultat:**
   - Toast notification z błędem: "Błąd połączenia. Sprawdź połączenie internetowe"
   - Modal pozostaje otwarty
   - Dane w formularzu są zachowane (można spróbować ponownie)
   - Przycisk "Utwórz zadanie" wraca do stanu aktywnego (nie jest disabled)

**Test 3.6: Loading state podczas tworzenia**

1. Kliknij "Nowe zadanie"
2. Wypełnij formularz
3. Kliknij "Utwórz zadanie"
4. **Oczekiwany rezultat (podczas request):**
   - Przycisk zmienia tekst na "Tworzenie..."
   - Przycisk jest disabled (nie można kliknąć wielokrotnie)
5. **Po sukcesie:**
   - Przycisk wraca do normalnego stanu
   - Modal się zamyka

---

### Flow 4: Privacy masking dla zadań prywatnych

#### Cel
Sprawdzenie czy opisy zadań prywatnych są maskowane dla nieuprzywilejowanych użytkowników.

#### Przygotowanie danych testowych

Utwórz zadania testowe:
1. **Zadanie A**: Prywatne, przypisane do User1, created_by User1
2. **Zadanie B**: Prywatne, przypisane do User2 (inny dział), created_by User2
3. **Zadanie C**: Publiczne, przypisane do User2

#### Kroki testowe

**Test 4.1: Właściciel widzi pełny opis zadania prywatnego**

1. Zaloguj się jako User1 (właściciel Zadania A)
2. Przejdź do `/tasks`
3. Znajdź Zadanie A
4. **Oczekiwany rezultat:**
   - Badge "Prywatne" jest widoczny
   - Opis zadania jest widoczny (nie zamaskowany)
   - Wszystkie szczegóły są dostępne

**Test 4.2: Inny employee nie widzi opisu prywatnego zadania**

1. Zaloguj się jako User2 (nie właściciel Zadania A)
2. Przejdź do `/tasks`
3. **Oczekiwany rezultat:**
   - Zadanie A nie jest widoczne na liście (RLS blokuje dostęp)
   - LUB (jeśli jest w tym samym dziale i zadanie przypisane do działu):
     - Zadanie A jest widoczne
     - Badge "Prywatne" jest widoczny
     - Opis pokazuje "[Szczegóły prywatne]" (zamaskowany)

**Test 4.3: Manager działu widzi pełny opis prywatnego zadania podwładnego**

1. Utwórz zadanie prywatne jako Employee (User1) z działu Engineering
2. Zaloguj się jako Manager działu Engineering
3. Przejdź do `/tasks`
4. Znajdź zadanie User1
5. **Oczekiwany rezultat:**
   - Zadanie jest widoczne
   - Badge "Prywatne" jest widoczny
   - Opis jest widoczny (manager ma dostęp)

**Test 4.4: Admin widzi wszystkie zadania prywatne**

1. Zaloguj się jako admin@example.com
2. Przejdź do `/tasks`
3. Ustaw filtr: Widoczność → "Prywatne"
4. **Oczekiwany rezultat:**
   - Wszystkie zadania prywatne są widoczne
   - Wszystkie opisy są widoczne (nie zamaskowane)
   - Admin ma pełny dostęp

**Test 4.5: Publiczne zadania są widoczne dla wszystkich**

1. Zaloguj się jako dowolny użytkownik
2. Przejdź do `/tasks`
3. Znajdź Zadanie C (publiczne)
4. **Oczekiwany rezultat:**
   - Zadanie jest widoczne (zgodnie z RLS)
   - Brak badge "Prywatne"
   - Opis jest widoczny
   - Wszystkie szczegóły są dostępne

---

### Flow 5: Wyświetlanie ETA z plan_slots

#### Cel
Sprawdzenie czy ETA jest obliczane i wyświetlane poprawnie na podstawie zaplanowanych slotów.

#### Przygotowanie danych testowych

Utwórz zadanie testowe:
- Zadanie D: estimate_minutes = 120 (2 godziny)

Dodaj plan_slots dla Zadania D:
1. Slot 1: 2026-01-05 10:00-11:00 (60 minut)
2. Slot 2: 2026-01-05 14:00-15:00 (60 minut)
Łącznie: 120 minut = 100% estymacji

#### Kroki testowe

**Test 5.1: ETA wyświetlane gdy 100% estymacji zaplanowane**

1. Zaloguj się jako właściciel Zadania D
2. Przejdź do `/tasks`
3. Znajdź Zadanie D
4. **Oczekiwany rezultat:**
   - Pole "ETA" jest widoczne
   - ETA pokazuje: "5 stycznia 2026, 15:00" (koniec ostatniego slotu)
   - Tekst ETA jest zielony (klasa `text-green-600`)

**Test 5.2: Brak ETA gdy mniej niż 100% zaplanowane**

1. Usuń Slot 2 (pozostaje tylko 60 minut = 50% estymacji)
2. Odśwież stronę `/tasks`
3. Znajdź Zadanie D
4. **Oczekiwany rezultat:**
   - Pole "ETA" nie jest widoczne (conditional rendering)
   - Widoczna tylko estymacja i ewentualnie due_date

**Test 5.3: Brak ETA gdy brak plan_slots**

1. Usuń wszystkie plan_slots dla Zadania D
2. Odśwież stronę `/tasks`
3. Znajdź Zadanie D
4. **Oczekiwany rezultat:**
   - Pole "ETA" nie jest widoczne
   - Zadanie jest widoczne normalnie (tylko bez ETA)

**Test 5.4: ETA aktualizuje się po dodaniu slotów**

1. Zadanie D ma 0 plan_slots
2. Przejdź do `/tasks` - brak ETA
3. Dodaj plan_slot (np. przez widok Plan) na 100% estymacji
4. Wróć do `/tasks`
5. **Oczekiwany rezultat:**
   - ETA pojawia się automatycznie (cache invalidation)
   - ETA pokazuje poprawną datę końca ostatniego slotu

---

### Flow 6: Responsywność i mobile

#### Cel
Sprawdzenie czy widok Tasks działa poprawnie na różnych urządzeniach.

#### Kroki testowe

**Test 6.1: Desktop (1920x1080)**

1. Otwórz `/tasks` w rozdzielczości desktop
2. **Oczekiwany rezultat:**
   - Siatka zadań: 3 kolumny (lg:grid-cols-3)
   - Filtry: 4 kolumny (lg:grid-cols-4)
   - Wszystkie elementy są czytelne
   - Nie ma horizontal scroll

**Test 6.2: Tablet (768x1024)**

1. Zmień rozdzielczość na tablet (Chrome DevTools)
2. Odśwież `/tasks`
3. **Oczekiwany rezultat:**
   - Siatka zadań: 2 kolumny (sm:grid-cols-2)
   - Filtry: 2 kolumny (sm:grid-cols-2)
   - Modal zajmuje większość ekranu
   - Touch targets >= 44x44px

**Test 6.3: Mobile (375x667 - iPhone SE)**

1. Zmień rozdzielczość na mobile
2. Odśwież `/tasks`
3. **Oczekiwany rezultat:**
   - Siatka zadań: 1 kolumna (domyślnie)
   - Filtry: 1 kolumna (domyślnie, stacked)
   - Modal fullscreen lub prawie fullscreen
   - Wszystkie przyciski są łatwe do kliknięcia
   - Tekst jest czytelny (nie za mały)

**Test 6.4: Landscape mobile (667x375)**

1. Obróć urządzenie do landscape
2. **Oczekiwany rezultat:**
   - Layout dostosowuje się
   - Modal nie wychodzi poza ekran
   - Można scrollować jeśli potrzeba

---

## 🐛 Znane problemy i edge cases

### Edge Case 1: Bardzo długi tytuł zadania
- **Problem:** Tytuł może wypchnąć badges poza kartę
- **Workaround:** CSS `line-clamp` lub `text-overflow: ellipsis`
- **Status:** Do naprawy w przyszłości

### Edge Case 2: Bardzo dużo zadań (100+)
- **Problem:** Może być wolne ładowanie i renderowanie
- **Rozwiązanie:** Implementacja paginacji lub infinite scroll
- **Status:** Planowane w przyszłości

### Edge Case 3: Brak połączenia podczas filtrowania
- **Problem:** Loading spinner bez końca
- **Rozwiązanie:** React Query retry + timeout
- **Status:** Częściowo obsłużone (3 retry)

### Edge Case 4: Równoczesne tworzenie zadań (race condition)
- **Problem:** Kliknięcie "Utwórz" wielokrotnie może utworzyć duplikaty
- **Rozwiązanie:** Przycisk disabled podczas mutation
- **Status:** ✅ Obsłużone

---

## 📊 Metryki wydajności

### Oczekiwane czasy ładowania (p90)
- Ładowanie listy zadań: < 2000ms (zgodnie z PRD)
- Filtrowanie: < 500ms
- Tworzenie zadania: < 1000ms
- Kalkulacja ETA (batch 50 zadań): < 100ms

### Narzędzia do pomiaru
- Chrome DevTools → Network tab → Timing
- Chrome DevTools → Performance tab
- Lighthouse → Performance audit

---

## ✅ Checklist przed release

### Funkcjonalność
- [ ] Wszystkie role użytkowników (admin, manager, employee) działają poprawnie
- [ ] RLS policies filtrują zadania zgodnie z uprawnieniami
- [ ] Filtrowanie działa dla wszystkich kombinacji
- [ ] Tworzenie zadań z walidacją działa
- [ ] Privacy masking działa poprawnie
- [ ] ETA wyświetla się gdy 100% zaplanowane

### UI/UX
- [ ] Loading states są widoczne
- [ ] Error messages są przyjazne
- [ ] Empty states mają pomocne komunikaty
- [ ] Toast notifications działają
- [ ] Modal otwiera się i zamyka poprawnie

### Performance
- [ ] Lista zadań ładuje się < 2s (p90)
- [ ] Brak memory leaks (sprawdź DevTools Memory)
- [ ] Brak niepotrzebnych re-renderów (React DevTools Profiler)

### Accessibility
- [ ] Keyboard navigation działa
- [ ] Screen reader ogłasza wszystkie elementy
- [ ] Focus management jest poprawny
- [ ] Color contrast >= 4.5:1
- [ ] Touch targets >= 44x44px

### Cross-browser
- [ ] Chrome - działa
- [ ] Firefox - działa
- [ ] Safari - działa
- [ ] Edge - działa

### Responsive
- [ ] Desktop (1920x1080) - działa
- [ ] Tablet (768x1024) - działa
- [ ] Mobile (375x667) - działa

---

## 📝 Raportowanie błędów

### Szablon zgłoszenia

```markdown
## Tytuł błędu
Krótki opis problemu

## Środowisko
- Browser: Chrome 120
- OS: Windows 11
- Rozdzielczość: 1920x1080
- Rola użytkownika: employee

## Kroki do reprodukcji
1. Zaloguj się jako employee@example.com
2. Przejdź do /tasks
3. Kliknij "Nowe zadanie"
4. ...

## Oczekiwany rezultat
Modal powinien się otworzyć

## Aktualny rezultat
Modal nie otwiera się, błąd w konsoli: ...

## Screenshots
[załącz screenshot]

## Logi konsoli
[załącz błędy z konsoli]

## Priorytet
- [ ] Critical (blokuje użytkowanie)
- [x] High (ważna funkcjonalność nie działa)
- [ ] Medium (funkcjonalność działa częściowo)
- [ ] Low (kosmetyczny problem)
```

---

## 🎓 Wskazówki dla testerów

1. **Testuj jako różne role** - każda rola ma inne uprawnienia
2. **Sprawdzaj Network tab** - weryfikuj czy API zwraca poprawne dane
3. **Sprawdzaj Console** - nie powinno być błędów JavaScript
4. **Testuj edge cases** - puste listy, bardzo długie teksty, brak danych
5. **Testuj na prawdziwych urządzeniach** - emulatory nie zawsze są dokładne
6. **Dokumentuj wszystko** - screenshots, logi, kroki do reprodukcji
7. **Testuj happy path i error path** - nie tylko poprawne scenariusze

---

## 📚 Dodatkowe zasoby

- [Plan implementacji widoku Tasks](.ai/tasks-view-implementation-plan.md)
- [Accessibility Checklist](./ACCESSIBILITY_CHECKLIST.md)
- [API Documentation](.ai/view-implementation-plan.md)
- [Database Schema](.ai/db-plan.md)

