# Playwright E2E Testing Guide - DailyPath

## Przegląd

Ten dokument opisuje zasady i najlepsze praktyki pisania testów end-to-end z użyciem Playwright w projekcie DailyPath.

**Status:** ✅ Konfiguracja ukończona  
**Data:** 2026-01-08

## Konfiguracja

### Plik konfiguracyjny (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Kluczowe ustawienia

- **Browser:** Tylko Chromium/Desktop Chrome (zgodnie z wytycznymi)
- **Base URL:** `http://localhost:3000`
- **Trace:** Włączony przy retry (debugging)
- **Screenshots:** Tylko przy błędach
- **Web Server:** Automatyczne uruchamianie dev servera przed testami

## Struktura testów

```
tests/
├── e2e/
│   ├── fixtures.ts          # Custom fixtures
│   ├── collections.spec.ts  # Przykładowe testy
│   └── example.spec.ts       # Template testów
```

## Podstawowe zasady

### 1. Używaj `data-test-id` zamiast selektorów CSS

**✅ DOBRZE:**
```typescript
const button = page.locator('[data-test-id="collection-create-button"]');
await button.click();
```

**❌ ŹLE:**
```typescript
const button = page.locator('.btn-primary');
const button = page.locator('#create-btn');
```

### 2. Zawsze czekaj na elementy przed interakcją

**✅ DOBRZE:**
```typescript
const dialog = page.locator('[data-test-id="collection-dialog"]');
await expect(dialog).toBeVisible();
await dialog.click();
```

**❌ ŹLE:**
```typescript
const dialog = page.locator('[data-test-id="collection-dialog"]');
await dialog.click(); // Może kliknąć zanim element się pojawi
```

### 3. Używaj Page Object Model

Dla większych testów, wydziel logikę do klas Page Object:

```typescript
class CollectionPage {
  constructor(private page: Page) {}

  async openCreateDialog() {
    const button = this.page.locator('[data-test-id="collection-create-button"]');
    await expect(button).toBeVisible();
    await button.click();
  }

  async fillCollectionForm(name: string, description: string) {
    await this.page.locator('[data-test-id="collection-name-input"]').fill(name);
    await this.page.locator('[data-test-id="collection-description-input"]').fill(description);
  }

  async saveCollection() {
    await this.page.locator('[data-test-id="collection-save-button"]').click();
  }
}
```

### 4. Izoluj testy używając browser contexts

```typescript
test('should create collection', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test code
  
  await context.close();
});
```

## Wzorce testów

### Podstawowy test

```typescript
import { test, expect } from '@playwright/test';

test('should display sidebar', async ({ page }) => {
  await page.goto('/dashboard');
  
  const sidebar = page.locator('[data-test-id="sidebar"]');
  await expect(sidebar).toBeVisible();
});
```

### Test z setup i teardown

```typescript
test.describe('Collection Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: logowanie, nawigacja
    await page.goto('/dashboard');
    await page.waitForSelector('[data-test-id="sidebar"]', { 
      state: 'visible', 
      timeout: 10000 
    });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: wylogowanie, czyszczenie danych
    // (opcjonalne)
  });

  test('should create collection', async ({ page }) => {
    // Test code
  });
});
```

### Test z wieloma asercjami

```typescript
test('should create and verify collection', async ({ page }) => {
  // 1. Otwórz dialog
  const createButton = page.locator('[data-test-id="collection-create-button"]');
  await expect(createButton).toBeVisible({ timeout: 10000 });
  await createButton.click();

  // 2. Weryfikuj dialog
  const dialog = page.locator('[data-test-id="collection-dialog"]');
  await expect(dialog).toBeVisible({ timeout: 10000 });
  
  const dialogTitle = page.locator('[data-test-id="collection-dialog-title"]');
  await expect(dialogTitle).toHaveText('Utwórz nową kolekcję');

  // 3. Wypełnij formularz
  const nameInput = page.locator('[data-test-id="collection-name-input"]');
  await expect(nameInput).toBeVisible();
  await nameInput.fill('Moja kolekcja');
  await expect(nameInput).toHaveValue('Moja kolekcja');

  // 4. Zapisz
  const saveButton = page.locator('[data-test-id="collection-save-button"]');
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // 5. Weryfikuj zamknięcie
  await expect(dialog).not.toBeVisible();
});
```

### Test z obsługą błędów

```typescript
test('should show error for empty name', async ({ page }) => {
  await page.goto('/dashboard');
  
  const createButton = page.locator('[data-test-id="collection-create-button"]');
  await createButton.click();

  const dialog = page.locator('[data-test-id="collection-dialog"]');
  await expect(dialog).toBeVisible();

  // Próba zapisania bez nazwy
  const saveButton = page.locator('[data-test-id="collection-save-button"]');
  await saveButton.click();

  // HTML5 validation powinno zapobiec submitowi
  const nameInput = page.locator('[data-test-id="collection-name-input"]');
  await expect(nameInput).toHaveAttribute('required');
});
```

## Custom Fixtures

### Podstawowa struktura (`tests/e2e/fixtures.ts`)

```typescript
import { test as base } from '@playwright/test';

type TestFixtures = {
  authenticatedUser: { page: Page; user: User };
};

export const test = base.extend<TestFixtures>({
  authenticatedUser: async ({ page }, use) => {
    // Setup: logowanie
    await page.goto('/login');
    await page.fill('[data-test-id="login-email"]', 'test@example.com');
    await page.fill('[data-test-id="login-password"]', 'password123');
    await page.click('[data-test-id="login-submit"]');
    await page.waitForURL('/dashboard');
    
    await use({ 
      page, 
      user: { email: 'test@example.com' } 
    });
  },
});

export { expect } from '@playwright/test';
```

### Użycie custom fixture

```typescript
import { test, expect } from './fixtures';

test('should access protected page', async ({ authenticatedUser }) => {
  const { page } = authenticatedUser;
  await page.goto('/tasks');
  // Test code
});
```

## API Testing

Playwright może testować API bezpośrednio:

```typescript
test('should fetch tasks from API', async ({ request }) => {
  const response = await request.get('/api/tasks');
  expect(response.ok()).toBeTruthy();
  
  const tasks = await response.json();
  expect(Array.isArray(tasks)).toBeTruthy();
});
```

## Visual Comparison

Używaj screenshotów do porównywania wizualnego:

```typescript
test('should match dashboard screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

## Debugging

### Trace Viewer

Trace jest automatycznie zbierany przy retry. Otwórz go:

```bash
npx playwright show-trace trace.zip
```

### Codegen Tool

Generuj testy automatycznie:

```bash
npx playwright codegen http://localhost:3000
```

### Debug Mode

Uruchom testy w trybie debug:

```bash
npx playwright test --debug
```

### Pause w teście

```typescript
test('should debug', async ({ page }) => {
  await page.goto('/dashboard');
  await page.pause(); // Otworzy Playwright Inspector
});
```

## Najlepsze praktyki

### 1. Semantyczne nazwy testów

**✅ DOBRZE:**
```typescript
test('should create collection with valid data', async ({ page }) => {
```

**❌ ŹLE:**
```typescript
test('test1', async ({ page }) => {
```

### 2. Grupuj powiązane testy

```typescript
test.describe('Collection Creation', () => {
  test('should create collection', () => {});
  test('should cancel creation', () => {});
  test('should validate form', () => {});
});
```

### 3. Używaj timeoutów dla powolnych operacji

```typescript
await expect(dialog).toBeVisible({ timeout: 10000 });
```

### 4. Testuj user flow, nie tylko komponenty

**✅ DOBRZE:** Test całego flow tworzenia kolekcji  
**❌ ŹLE:** Test tylko renderowania przycisku

### 5. Unikaj hardcoded wartości czasu

**✅ DOBRZE:**
```typescript
await page.waitForTimeout(1000); // Tylko gdy konieczne
```

**❌ ŹLE:**
```typescript
await page.waitForTimeout(5000); // Zbyt długo, użyj expect().toBeVisible()
```

### 6. Czytaj dokumentację Playwright

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)

## Uruchamianie testów

### Wszystkie testy

```bash
npm run test:e2e
# lub
npx playwright test
```

### Konkretny plik

```bash
npx playwright test tests/e2e/collections.spec.ts
```

### Konkretny test

```bash
npx playwright test -g "should create collection"
```

### Z UI mode

```bash
npx playwright test --ui
```

### W trybie headed (z widoczną przeglądarką)

```bash
npx playwright test --headed
```

### Z określoną przeglądarką

```bash
npx playwright test --project=chromium
```

## Raporty

### HTML Report

Automatycznie generowany po testach:

```bash
npx playwright show-report
```

### CI/CD

W CI, użyj:

```typescript
reporter: process.env.CI ? 'github' : 'html',
```

## Troubleshooting

### Problem: Testy są niestabilne (flaky)

**Rozwiązania:**
1. Zawsze używaj `await expect().toBeVisible()` przed interakcją
2. Zwiększ timeout dla powolnych operacji
3. Używaj `waitForLoadState()` dla stron
4. Unikaj `waitForTimeout()` - używaj asercji

### Problem: Element nie jest znaleziony

**Rozwiązania:**
1. Sprawdź czy `data-test-id` jest poprawnie ustawiony
2. Sprawdź czy element jest renderowany (React hydration)
3. Użyj `waitForSelector()` z odpowiednim timeoutem
4. Sprawdź czy element nie jest w iframe

### Problem: Testy są zbyt wolne

**Rozwiązania:**
1. Uruchamiaj testy równolegle (`fullyParallel: true`)
2. Używaj `test.describe.parallel()` dla niezależnych testów
3. Minimalizuj setup/teardown
4. Używaj API calls zamiast UI dla setupu

### Problem: Screenshots nie są zapisywane

**Rozwiązanie:** Sprawdź konfigurację `screenshot: 'only-on-failure'` w `playwright.config.ts`

## Przykłady z projektu

### Pełny przykład: Tworzenie kolekcji

```typescript
import { test, expect } from '@playwright/test';

test.describe('Collection Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-test-id="sidebar"]', { 
      state: 'visible', 
      timeout: 10000 
    });
  });

  test('should create a new collection', async ({ page }) => {
    // 1. Otwórz sidebar
    const sidebar = page.locator('[data-test-id="sidebar"]');
    await expect(sidebar).toBeVisible();

    // 2. Kliknij w przycisk nowej kolekcji
    const createButton = page.locator('[data-test-id="collection-create-button"]');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // 3. Poczekaj na otwarty dialog
    const dialog = page.locator('[data-test-id="collection-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const dialogTitle = page.locator('[data-test-id="collection-dialog-title"]');
    await expect(dialogTitle).toHaveText('Utwórz nową kolekcję');

    // 4. Wypełnij formularz
    const nameInput = page.locator('[data-test-id="collection-name-input"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Moja pierwsza kolekcja');

    const descriptionInput = page.locator('[data-test-id="collection-description-input"]');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill('Opis mojej kolekcji');

    // Weryfikacja wypełnionych pól
    await expect(nameInput).toHaveValue('Moja pierwsza kolekcja');
    await expect(descriptionInput).toHaveValue('Opis mojej kolekcji');

    // 5. Zapisz kolekcję
    const saveButton = page.locator('[data-test-id="collection-save-button"]');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Weryfikacja - dialog powinien się zamknąć
    await expect(dialog).not.toBeVisible();
  });
});
```

## Checklist przed commitowaniem testów

- [ ] Używam tylko `data-test-id` do selekcji elementów
- [ ] Wszystkie interakcje poprzedzone `await expect().toBeVisible()`
- [ ] Testy są izolowane (nie zależą od innych testów)
- [ ] Używam semantycznych nazw testów
- [ ] Testy są szybkie (< 30s każdy)
- [ ] Dodałem odpowiednie timeouty
- [ ] Testy działają lokalnie
- [ ] Testy działają w CI (jeśli dostępne)

## Przydatne linki

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [E2E Test Attributes Guide](./E2E_TEST_ATTRIBUTES.md) - Lista dostępnych `data-test-id`
