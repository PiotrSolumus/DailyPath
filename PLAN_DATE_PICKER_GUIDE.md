# Przewodnik: Date Picker w Planie Dnia

## ✨ Nowe funkcje

### 1. Date Picker - Wybór daty
Możesz teraz łatwo wybrać dowolny dzień klikając na datę w nagłówku kalendarza.

### 2. Widok tygodniowy z zadaniami
Widok tygodniowy teraz poprawnie wyświetla wszystkie zaplanowane zadania.

## 🚀 Jak korzystać

### Krok 1: Zaloguj się
1. Upewnij się, że serwer deweloperski działa (`npm run dev`)
2. Otwórz http://localhost:3000 (lub inny port wskazany w terminalu)
3. Zaloguj się jako `employee1@test.com` / `test123test`

### Krok 2: Przejdź do Planu Dnia
1. Kliknij "Plan dnia" w menu bocznym
2. Zobaczysz kalendarz z:
   - Strzałkami nawigacji (Poprzedni/Następny)
   - Przyciskiem "Dzisiaj"
   - **NOWĄ FUNKCJĄ**: Klikalna data z ikoną kalendarza
   - Przełącznikiem widoku Dzień/Tydzień

### Krok 3: Używanie Date Pickera
1. **Kliknij na datę** (np. "sobota, 4 stycznia 2026") w nagłówku kalendarza
2. Otworzy się okienko z kalendarzem
3. **Wybierz interesujący Cię dzień** klikając na niego
4. Kalendarz automatycznie przełączy się na wybrany dzień

### Krok 4: Przeglądanie zaplanowanych zadań

#### Dane testowe
Seedowane dane zawierają zadania zaplanowane na:
- **5 stycznia 2026** - 2 sloty (Employee1):
  - 14:00-16:00 (2 godziny)
  - 10:00-12:00 (2 godziny) - następnego dnia
- **6 stycznia 2026** - kontynuacja zadania (Employee1):
  - 10:00-12:00 (2 godziny)
- **7 stycznia 2026** - zadanie Employee2:
  - 09:00-12:00 (3 godziny)

#### Testowanie
1. **Otwórz date picker** (kliknij na datę)
2. **Wybierz 5 stycznia 2026**
3. Powinieneś zobaczyć zaplanowane zadania w kalendarzu
4. **Przełącz na widok "Tydzień"**
5. Zobaczysz wszystkie zadania z całego tygodnia

## 🎯 Funkcje do przetestowania

### ✅ Date Picker
- [ ] Kliknij na datę - otwiera się kalendarz
- [ ] Wybierz inny dzień - widok się aktualizuje
- [ ] Wybierz dzień z innego miesiąca - działa poprawnie
- [ ] Kliknij poza kalendarzem - zamyka się

### ✅ Widok dzienny
- [ ] Pokaż zadania z wybranego dnia
- [ ] Drag & drop zadań (przesuwanie)
- [ ] Wizualna indykacja konfliktów (nakładanie się zadań)

### ✅ Widok tygodniowy
- [ ] Pokaż wszystkie zadania z tygodnia
- [ ] Każde zadanie jest w odpowiednim dniu
- [ ] Zadania są poprawnie pozycjonowane czasowo
- [ ] Drag & drop działa w widoku tygodniowym

### ✅ Nawigacja
- [ ] Strzałki Poprzedni/Następny działają
- [ ] Przycisk "Dzisiaj" wraca do aktualnej daty
- [ ] Przełączanie między widokiem Dzień/Tydzień

## 🐛 Sprawdzanie błędów

Jeśli nie widzisz zadań:

1. **Sprawdź czy jesteś zalogowany jako właściwy użytkownik**
   - Employee1 ma zadania na 5-6 stycznia
   - Employee2 ma zadanie na 7 stycznia

2. **Sprawdź konsolę przeglądarki** (F12)
   - Powinny być logi: "Comparing slot...", "Parsed range..."
   - Sprawdź czy są błędy API

3. **Sprawdź czy dane są zaseedowane**
   ```bash
   # W Supabase Studio (http://127.0.0.1:54323)
   # Przejdź do: Table Editor > plan_slots
   # Sprawdź czy są jakieś rekordy
   ```

4. **Jeśli brak danych, uruchom seed:**
   ```bash
   node scripts/seed-database.js
   ```

## 📝 Notatki techniczne

### Zmiany w kodzie:
1. **Dodano komponenty UI:**
   - `src/components/ui/calendar.tsx` - komponent kalendarza (shadcn/ui)
   - `src/components/ui/popover.tsx` - komponent popover (shadcn/ui)

2. **Zaktualizowano:**
   - `src/components/calendar/CalendarControls.tsx` - dodano date picker
   - `src/components/calendar/PlanCalendar.tsx` - dodano obsługę date pickera i widoku tygodniowego

3. **Utworzono:**
   - `src/components/calendar/WeekTaskSlot.tsx` - dedykowany komponent dla zadań w widoku tygodniowym

### Biblioteki:
- `react-day-picker` - komponent kalendarza
- `date-fns` - manipulacja datami
- `@radix-ui/react-popover` - popover dla date pickera

## ✨ Korzyści

- **Szybsze nawigowanie** - nie musisz klikać wielokrotnie "Następny" aby dotrzeć do odległej daty
- **Lepsza widoczność** - widzisz cały miesiąc i możesz szybko wybrać interesujący Cię dzień
- **Intuicyjny interfejs** - standardowy wybór daty znany z większości aplikacji
- **Widok tygodniowy** - teraz pokazuje wszystkie zaplanowane zadania

## 🎨 Dostępność

Date picker jest w pełni dostępny:
- ✅ Obsługa klawiatury (Tab, Enter, strzałki)
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ ARIA labels

## 🔜 Możliwe ulepszenia w przyszłości

- Oznaczenie dni z zaplanowanymi zadaniami w date pickerze (kropki/badges)
- Szybkie przełączanie między miesiącami
- Skróty klawiszowe (np. Ctrl+D dla date pickera)
- Zapamiętywanie ostatnio wybranego widoku (dzień/tydzień)

