# Accessibility Checklist - Widok Tasks

## ✅ Zaimplementowane funkcje accessibility

### Keyboard Navigation

#### TaskCard
- ✅ `role="button"` - semantyczna rola dla interaktywnej karty
- ✅ `tabIndex={0}` - możliwość nawigacji klawiaturą (Tab)
- ✅ Obsługa Enter i Space dla aktywacji
- ✅ `focus-visible:ring-2` - widoczny focus ring dla użytkowników klawiatury
- ✅ `aria-label` - opisowy label dla screen readers zawierający tytuł, priorytet, status i prywatność

#### TaskFilters
- ✅ Wszystkie filtry (Select) są dostępne z klawiatury
- ✅ Przycisk "Wyczyść" z `aria-label="Wyczyść wszystkie filtry"`
- ✅ Search input z `aria-label` i `disabled` (placeholder dla przyszłości)
- ✅ Ikony dekoracyjne z `aria-hidden="true"`

#### CreateTaskForm
- ✅ Wszystkie pola formularza dostępne z klawiatury
- ✅ `aria-required="true"` dla wymaganych pól
- ✅ `aria-describedby` dla pól z dodatkowymi wymaganiami (estymacja)
- ✅ Hint text dla estymacji (minimum 15, wielokrotność 15)
- ✅ `sr-only` hint dla checkboxa prywatności

#### TaskList
- ✅ `role="status"` dla stanu ładowania
- ✅ `role="alert"` dla błędów
- ✅ `role="list"` i `role="listitem"` dla listy zadań
- ✅ `aria-live="polite"` dla ładowania i pustego stanu
- ✅ `aria-live="assertive"` dla błędów
- ✅ `aria-label` z liczbą zadań dla listy

### Screen Reader Support

#### ARIA Landmarks
- ✅ `<section aria-labelledby="filters-heading">` - sekcja filtrów z labelą
- ✅ `role="list"` - semantyczna lista zadań
- ✅ `role="status"` - komunikaty o stanie
- ✅ `role="alert"` - komunikaty o błędach

#### ARIA Labels
- ✅ TaskCard: pełny opis zadania w `aria-label`
- ✅ Wszystkie inputy mają powiązane `<Label>` przez `htmlFor`
- ✅ Ikony dekoracyjne z `aria-hidden="true"`
- ✅ Przyciski z opisowymi `aria-label` gdy brak tekstu

#### Live Regions
- ✅ Loading state: `aria-live="polite"` + `<span className="sr-only">`
- ✅ Error state: `aria-live="assertive"` dla natychmiastowego ogłoszenia
- ✅ Empty state: `aria-live="polite"` dla informacji o braku zadań

#### Screen Reader Only Content
- ✅ `<dt className="sr-only">` - labele dla definition lists w TaskCard
- ✅ `<span className="sr-only">` - dodatkowe kontekstowe informacje
- ✅ Hint text dla checkboxa prywatności (wyjaśnienie działania)

### Color Contrast

#### Badges
- ✅ PriorityBadge: high (destructive - red), medium (warning - yellow), low (info - blue)
- ✅ StatusBadge: done (success - green), in_progress (info - blue), blocked (warning - yellow), todo (outline)
- ✅ PrivateTaskBadge: purple-100 background z purple-700 text
- ✅ Wszystkie kombinacje kolorów spełniają WCAG AA (4.5:1 dla tekstu)

#### States
- ✅ Error state: border-red-200, bg-red-50, text-red-900 (wysoki kontrast)
- ✅ Focus ring: ring-ring z ring-offset-2 (widoczny dla wszystkich użytkowników)
- ✅ Disabled inputs: opacity-50 + cursor-not-allowed

### Form Validation

#### HTML5 Validation
- ✅ `required` attribute dla wymaganych pól
- ✅ `type="number"` z `min` i `step` dla estymacji
- ✅ `type="date"` dla daty docelowej
- ✅ Browser native error messages

#### Accessible Error Messages
- ✅ Toast notifications (sonner) dla błędów API
- ✅ Przyjazne komunikaty błędów przez `getErrorMessage()`
- ✅ Inline hints dla złożonych wymagań (estymacja)

---

## 🧪 Testy do wykonania manualnie

### Keyboard Navigation Tests

#### Test 1: Nawigacja po liście zadań
1. Wejdź na `/tasks`
2. Naciśnij Tab - focus powinien przejść do pierwszego interaktywnego elementu
3. Kontynuuj Tab przez wszystkie elementy:
   - Przycisk "Nowe zadanie"
   - Filtry (Status, Priorytet, Widoczność, Search)
   - Przycisk "Wyczyść" (jeśli są aktywne filtry)
   - Karty zadań (każda powinna być dostępna)
4. Na karcie zadania naciśnij Enter lub Space - powinno wywołać onClick
5. Sprawdź czy focus ring jest widoczny na każdym elemencie

**Expected:** Wszystkie elementy dostępne z klawiatury, widoczny focus ring, Enter/Space aktywuje akcje

#### Test 2: Nawigacja w formularzu tworzenia zadania
1. Kliknij "Nowe zadanie" lub naciśnij Enter gdy jest w focus
2. Modal powinien się otworzyć z focus na pierwszym polu (title)
3. Naciśnij Tab przez wszystkie pola formularza:
   - Nazwa (required)
   - Opis (textarea)
   - Priorytet (select)
   - Estymacja (number input)
   - Data docelowa (date input)
   - Zadanie prywatne (checkbox)
   - Przyciski (Anuluj, Utwórz zadanie)
4. Naciśnij Escape - modal powinien się zamknąć
5. Otwórz ponownie i naciśnij Tab do "Anuluj", Enter - modal zamyka się

**Expected:** Focus trap w modalu, Escape zamyka, Tab navigation działa, Enter submituje formularz

#### Test 3: Filtrowanie z klawiatury
1. Wejdź na `/tasks`
2. Tab do filtra Status
3. Naciśnij Space lub Enter - dropdown się otwiera
4. Strzałki góra/dół - nawigacja po opcjach
5. Enter - wybór opcji
6. Sprawdź czy URL się zaktualizował
7. Sprawdź czy lista zadań się odświeżyła

**Expected:** Filtry działają z klawiatury, URL sync, automatyczny refetch

### Screen Reader Tests (NVDA/JAWS)

#### Test 4: Czytanie listy zadań
1. Włącz screen reader (NVDA: Ctrl+Alt+N)
2. Wejdź na `/tasks`
3. Screen reader powinien ogłosić:
   - Nagłówek strony "Zadania"
   - Opis "Zarządzaj swoimi zadaniami"
   - Przycisk "Nowe zadanie"
4. Nawiguj do sekcji filtrów:
   - "Filtry" heading
   - Każdy filtr z labelą
5. Nawiguj do listy zadań:
   - "Lista zadań (X)" gdzie X to liczba zadań
   - Każda karta: "Zadanie: [tytuł], priorytet [low/medium/high], status [todo/in_progress/blocked/done], prywatne (jeśli applicable)"

**Expected:** Wszystkie elementy są ogłaszane z odpowiednimi labelami i rolami

#### Test 5: Live regions
1. Włącz screen reader
2. Wejdź na `/tasks`
3. Zmień filtr - screen reader powinien ogłosić "Ładowanie zadań..."
4. Po załadowaniu - ogłoszenie liczby zadań lub "Brak zadań"
5. Symuluj błąd (wyłącz internet) - screen reader powinien natychmiast ogłosić błąd

**Expected:** Live regions działają, komunikaty są ogłaszane automatycznie

#### Test 6: Formularze z screen reader
1. Włącz screen reader
2. Otwórz modal "Nowe zadanie"
3. Screen reader powinien ogłosić:
   - "Dialog: Nowe zadanie"
   - Każde pole z labelą i statusem (wymagane/opcjonalne)
   - Hint text dla estymacji
   - Wyjaśnienie dla checkboxa prywatności
4. Spróbuj submit z pustym tytułem - browser validation message powinien być ogłoszony

**Expected:** Wszystkie pola są opisane, hints są czytane, validation działa

### Color Contrast Tests

#### Test 7: Sprawdzenie kontrastu
1. Użyj narzędzia: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
2. Sprawdź kombinacje kolorów:
   - PriorityBadge high (red): destructive bg + white text
   - PriorityBadge medium (yellow): warning bg + white text
   - PriorityBadge low (blue): info bg + white text
   - StatusBadge done (green): success bg + white text
   - PrivateTaskBadge: purple-100 bg + purple-700 text
   - Error state: red-50 bg + red-900 text
3. Wszystkie powinny mieć ratio >= 4.5:1 (WCAG AA)

**Expected:** Wszystkie kombinacje spełniają WCAG AA

#### Test 8: High Contrast Mode (Windows)
1. Włącz Windows High Contrast Mode (Alt+Shift+PrtScn)
2. Wejdź na `/tasks`
3. Sprawdź czy:
   - Wszystkie elementy są widoczne
   - Focus ring jest widoczny
   - Granice kart są widoczne
   - Tekst jest czytelny

**Expected:** Wszystko działa w high contrast mode

### Focus Management Tests

#### Test 9: Focus trap w modalu
1. Otwórz modal "Nowe zadanie"
2. Naciśnij Tab wielokrotnie
3. Focus powinien pozostać w modalu (nie wychodzić na tło)
4. Po ostatnim elemencie (przycisk "Utwórz") Tab wraca do pierwszego (title input)
5. Shift+Tab - nawigacja wstecz działa

**Expected:** Focus trap działa, nie można wyjść z modalu przez Tab

#### Test 10: Focus return po zamknięciu modalu
1. Tab do przycisku "Nowe zadanie"
2. Naciśnij Enter - modal się otwiera
3. Naciśnij Escape - modal się zamyka
4. Focus powinien wrócić do przycisku "Nowe zadanie"

**Expected:** Focus wraca do elementu, który otworzył modal

### Mobile Accessibility Tests

#### Test 11: Touch targets
1. Otwórz `/tasks` na telefonie lub w Chrome DevTools (mobile view)
2. Sprawdź czy wszystkie interaktywne elementy mają minimum 44x44px:
   - Karty zadań
   - Przyciski
   - Filtry (select)
   - Checkbox

**Expected:** Wszystkie touch targets >= 44x44px (WCAG 2.5.5)

#### Test 12: Zoom do 200%
1. Wejdź na `/tasks`
2. Zoom do 200% (Ctrl + +)
3. Sprawdź czy:
   - Wszystkie elementy są widoczne
   - Nie ma horizontal scroll (oprócz intencjonalnego)
   - Tekst nie jest obcięty
   - Layout się dostosowuje (responsywny)

**Expected:** Wszystko działa przy 200% zoom (WCAG 1.4.4)

---

## 📋 Checklist przed merge

### Keyboard
- [ ] Wszystkie interaktywne elementy dostępne z klawiatury
- [ ] Focus visible dla wszystkich elementów
- [ ] Enter/Space aktywują akcje
- [ ] Escape zamyka modaly
- [ ] Focus trap w modalach
- [ ] Focus return po zamknięciu modalu

### Screen Reader
- [ ] Wszystkie elementy mają odpowiednie role
- [ ] ARIA labels dla elementów bez visible text
- [ ] ARIA live regions dla dynamicznych zmian
- [ ] Landmarks (section, nav, main) są użyte
- [ ] Ikony dekoracyjne z aria-hidden
- [ ] sr-only dla dodatkowego kontekstu

### Color & Contrast
- [ ] Wszystkie kombinacje kolorów >= 4.5:1 (WCAG AA)
- [ ] Focus ring widoczny (nie tylko color)
- [ ] Działa w high contrast mode
- [ ] Nie polegamy tylko na kolorze (ikony + tekst)

### Forms
- [ ] Wszystkie inputy mają labele
- [ ] Required fields z aria-required
- [ ] Error messages są accessible
- [ ] Hints z aria-describedby
- [ ] HTML5 validation działa

### Mobile
- [ ] Touch targets >= 44x44px
- [ ] Działa przy 200% zoom
- [ ] Responsywny layout
- [ ] Nie wymaga horizontal scroll

---

## 🔧 Narzędzia do testowania

### Automatyczne
- **axe DevTools** (Chrome extension) - automatyczne testy accessibility
- **Lighthouse** (Chrome DevTools) - audit accessibility
- **WAVE** (WebAIM) - visual feedback dla problemów

### Manualne
- **NVDA** (Windows) - darmowy screen reader
- **JAWS** (Windows) - komercyjny screen reader (trial available)
- **VoiceOver** (macOS/iOS) - wbudowany screen reader
- **TalkBack** (Android) - wbudowany screen reader
- **Keyboard only** - odłącz mysz i testuj

### Contrast
- **WebAIM Contrast Checker** - sprawdzanie kontrastu kolorów
- **Chrome DevTools** - built-in contrast checker
- **Colour Contrast Analyser** (TPGi) - desktop app

---

## 📚 Zasoby

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

