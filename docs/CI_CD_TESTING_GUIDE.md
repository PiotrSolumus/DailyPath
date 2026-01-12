# 🧪 Przewodnik: Uruchamianie testów i zrzuty ekranu z CI/CD

## 📋 Spis treści

1. [Uruchamianie testów lokalnie](#uruchamianie-testów-lokalnie)
2. [Uruchamianie CI/CD na GitHub](#uruchamianie-cicd-na-github)
3. [Zrzuty ekranu z testów](#zrzuty-ekranu-z-testów)
4. [Zrzuty ekranu z CI/CD](#zrzuty-ekranu-z-cicd)
5. [Troubleshooting](#troubleshooting)

---

## 🖥️ Uruchamianie testów lokalnie

### Testy jednostkowe (Vitest)

```bash
# Wszystkie testy jednostkowe
npm run test

# Testy w trybie watch (automatyczne uruchamianie przy zmianach)
npm run test:watch

# Testy z UI
npm run test:ui

# Testy z raportem coverage
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Wszystkie testy E2E
npm run test:e2e

# Testy E2E z UI (interaktywny tryb)
npm run test:e2e:ui

# Testy E2E w trybie debug
npm run test:e2e:debug

# Konkretny plik testowy
npx playwright test tests/e2e/collections.spec.ts

# Konkretny test (po nazwie)
npx playwright test -g "should create a new task"

# Testy z widoczną przeglądarką (headed mode)
npx playwright test --headed
```

### Build produkcyjny

```bash
# Build aplikacji
npm run build

# Preview builda lokalnie
npm run preview
```

---

## 🚀 Uruchamianie CI/CD na GitHub

### Automatyczne uruchomienie

CI/CD uruchamia się automatycznie w następujących sytuacjach:

1. **Push do `master` lub `main`**
   ```bash
   git push origin master
   ```

2. **Pull Request do `master` lub `main`**
   - Utwórz PR na GitHub
   - Workflow uruchomi się automatycznie

### Ręczne uruchomienie (Manual)

1. Przejdź do repozytorium na GitHub
2. Kliknij zakładkę **Actions**
3. Wybierz workflow **CI/CD Pipeline**
4. Kliknij **Run workflow**
5. Wybierz branch (np. `master`)
6. Kliknij **Run workflow**

### Sprawdzanie statusu

1. **W GitHub UI:**
   - Przejdź do: `https://github.com/PiotrSolumus/DailyPath/actions`
   - Kliknij na ostatnie uruchomienie workflow
   - Sprawdź status każdego joba:
     - ✅ **Zielony** = sukces
     - ❌ **Czerwony** = błąd
     - 🟡 **Żółty** = w trakcie

2. **Status Badge:**
   Dodaj do `README.md`:
   ```markdown
   ![CI/CD](https://github.com/PiotrSolumus/DailyPath/workflows/CI%2FCD%20Pipeline/badge.svg)
   ```

---

## 📸 Zrzuty ekranu z testów

### Automatyczne zrzuty ekranu

Playwright automatycznie robi zrzuty ekranu przy błędach testów (konfiguracja: `screenshot: 'only-on-failure'`).

**Lokalizacja zrzutów:**
```
test-results/
└── [nazwa-testu]/
    └── screenshot.png
```

### Ręczne zrzuty ekranu w testach

Możesz dodać zrzuty ekranu w dowolnym momencie testu:

```typescript
test('should create task', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Zrzut ekranu całej strony
  await page.screenshot({ path: 'screenshots/dashboard.png' });
  
  // Zrzut ekranu konkretnego elementu
  const sidebar = page.locator('[data-test-id="sidebar"]');
  await sidebar.screenshot({ path: 'screenshots/sidebar.png' });
  
  // Zrzut ekranu z pełnym viewportem
  await page.screenshot({ 
    path: 'screenshots/full-page.png',
    fullPage: true 
  });
});
```

### Zrzuty ekranu z Visual Comparison

```typescript
test('should match dashboard screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Porównanie z baseline screenshotem
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

**Lokalizacja baseline screenshots:**
```
tests/e2e/
└── collections.spec.ts-snapshots/
    └── dashboard.png
```

### Otwieranie zrzutów ekranu

```bash
# Otwórz folder z zrzutami ekranu
# Windows
explorer test-results

# Linux/Mac
open test-results  # Mac
xdg-open test-results  # Linux
```

---

## 📊 Zrzuty ekranu z CI/CD

### Automatyczne zrzuty ekranu w CI

Workflow automatycznie przechwytuje zrzuty ekranu z testów Playwright i uploaduje je jako artifacts.

**Jak pobrać zrzuty ekranu z CI:**

1. Przejdź do uruchomienia workflow na GitHub
2. Przewiń w dół do sekcji **Artifacts**
3. Znajdź artifact **playwright-report** lub **playwright-test-results**
4. Kliknij **Download** aby pobrać ZIP
5. Rozpakuj i otwórz:
   - `playwright-report/index.html` - interaktywny raport z zrzutami ekranu
   - `test-results/` - folder ze wszystkimi zrzutami ekranu

### Raport HTML z zrzutami ekranu

Po pobraniu artifactu:

```bash
# Rozpakuj ZIP
unzip playwright-report.zip  # Linux/Mac
# lub
Expand-Archive playwright-report.zip  # Windows PowerShell

# Otwórz raport
npx playwright show-report playwright-report
```

Raport zawiera:
- ✅ Listę wszystkich testów
- 📸 Zrzuty ekranu przy błędach
- 📊 Timeline wykonania testów
- 🔍 Trace viewer dla debugowania

### Zrzuty ekranu z GitHub Actions UI

1. Przejdź do uruchomienia workflow
2. Kliknij na job **E2E Tests**
3. Rozwiń sekcję **Run E2E tests**
4. Jeśli testy się nie powiodły, zobaczysz linki do zrzutów ekranu w logach

### Screenshot całego procesu CI/CD

Aby zrobić screenshot całego procesu CI/CD:

1. **Opcja 1: Screenshot z GitHub UI**
   - Przejdź do: `https://github.com/PiotrSolumus/DailyPath/actions`
   - Otwórz uruchomienie workflow
   - Zrób screenshot całej strony (F12 → Screenshot w DevTools)

2. **Opcja 2: Automatyczny screenshot workflow**
   - Użyj narzędzi do automatyzacji przeglądarki (np. Playwright)
   - Otwórz stronę Actions i zrób screenshot

3. **Opcja 3: Status Badge**
   - Dodaj badge do README (automatycznie aktualizuje się)
   - Zrób screenshot README z badge

---

## 🔧 Konfiguracja zrzutów ekranu

### Zmiana konfiguracji w `playwright.config.ts`

```typescript
export default defineConfig({
  use: {
    // Zawsze rób zrzuty ekranu
    screenshot: 'on',
    
    // Tylko przy błędach (domyślne)
    screenshot: 'only-on-failure',
    
    // Nigdy nie rób zrzutów ekranu
    screenshot: 'off',
  },
});
```

### Zrzuty ekranu dla konkretnego testu

```typescript
test('should create task', async ({ page }) => {
  // Tylko dla tego testu
  test.info().attach('screenshot', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});
```

---

## 🐛 Troubleshooting

### Problem: Zrzuty ekranu nie są zapisywane

**Rozwiązania:**
1. Sprawdź konfigurację `screenshot` w `playwright.config.ts`
2. Upewnij się, że testy faktycznie się nie powiodły (zrzuty są tylko przy błędach)
3. Sprawdź uprawnienia do zapisu w folderze `test-results/`

### Problem: Nie widzę artifacts w CI

**Rozwiązania:**
1. Upewnij się, że workflow się zakończył (nie jest w trakcie)
2. Sprawdź czy job `test-e2e` się wykonał
3. Artifacts są dostępne przez 30 dni (dla playwright-report)

### Problem: Zrzuty ekranu są puste/czarne

**Rozwiązania:**
1. Upewnij się, że aplikacja jest uruchomiona (`npm run dev`)
2. Sprawdź czy strona się załadowała przed zrzutem ekranu
3. Dodaj `await page.waitForLoadState('networkidle')` przed screenshotem

### Problem: Nie mogę pobrać artifacts

**Rozwiązania:**
1. Upewnij się, że jesteś zalogowany na GitHub
2. Sprawdź uprawnienia do repozytorium
3. Artifacts mogą być dostępne tylko dla właścicieli repozytorium

---

## 📝 Przykładowy scenariusz: Screenshot działającego CI/CD

### Krok 1: Uruchom testy lokalnie

```bash
npm run test:e2e
```

### Krok 2: Sprawdź zrzuty ekranu lokalnie

```bash
npx playwright show-report
```

### Krok 3: Push do GitHub (uruchamia CI/CD)

```bash
git add .
git commit -m "Test: Add E2E tests"
git push origin master
```

### Krok 4: Sprawdź status na GitHub

1. Przejdź do: `https://github.com/PiotrSolumus/DailyPath/actions`
2. Kliknij na ostatnie uruchomienie
3. Poczekaj na zakończenie wszystkich jobów (~10-15 minut)

### Krok 5: Pobierz artifacts z zrzutami ekranu

1. W uruchomieniu workflow, przewiń do sekcji **Artifacts**
2. Pobierz **playwright-report**
3. Rozpakuj i otwórz `index.html`

### Krok 6: Zrób screenshot całego procesu CI/CD

1. Wróć do strony Actions
2. Zrób screenshot całej strony (F12 → Screenshot lub narzędzie do screenshotów)
3. Lub użyj status badge z README

---

## 🎯 Szybkie komendy

```bash
# Testy lokalnie
npm run test              # Testy jednostkowe
npm run test:e2e         # Testy E2E
npm run build            # Build produkcyjny

# Zrzuty ekranu
npx playwright show-report                    # Otwórz raport HTML
npx playwright test --screenshot=on          # Zawsze rób zrzuty ekranu

# CI/CD
git push origin master                        # Uruchamia CI/CD automatycznie
# Lub ręcznie przez GitHub UI: Actions → Run workflow
```

---

## 📚 Dodatkowe zasoby

- [Playwright Screenshots](https://playwright.dev/docs/screenshots)
- [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [CI/CD Workflow](./.github/workflows/ci.yml)
- [Playwright E2E Testing Guide](./PLAYWRIGHT_E2E_TESTING.md)
