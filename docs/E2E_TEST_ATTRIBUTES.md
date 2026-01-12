# Atrybuty data-test-id dla testów E2E

## Przegląd

Wszystkie kluczowe komponenty zostały wyposażone w atrybuty `data-test-id` do testów end-to-end z Playwright.

## Scenariusz: Tworzenie nowej kolekcji

### Kroki scenariusza:
1. Otwórz sidebar
2. Kliknij w przycisk nowej kolekcji
3. Poczekaj na otwarty dialog
4. Wypełnij nowe kolekcje
5. Zapisz kolekcje

### Przykładowy test Playwright

```typescript
import { test, expect } from '@playwright/test';

test('should create new collection', async ({ page }) => {
  // 1. Otwórz sidebar
  const sidebar = page.locator('[data-test-id="sidebar"]');
  await expect(sidebar).toBeVisible();

  // 2. Kliknij w przycisk nowej kolekcji
  const createButton = page.locator('[data-test-id="collection-create-button"]');
  await createButton.click();

  // 3. Poczekaj na otwarty dialog
  const dialog = page.locator('[data-test-id="collection-dialog"]');
  await expect(dialog).toBeVisible();
  
  const dialogTitle = page.locator('[data-test-id="collection-dialog-title"]');
  await expect(dialogTitle).toHaveText('Utwórz nową kolekcję');

  // 4. Wypełnij nowe kolekcje
  const nameInput = page.locator('[data-test-id="collection-name-input"]');
  await nameInput.fill('Moja pierwsza kolekcja');
  
  const descriptionInput = page.locator('[data-test-id="collection-description-input"]');
  await descriptionInput.fill('Opis mojej kolekcji');

  // 5. Zapisz kolekcje
  const saveButton = page.locator('[data-test-id="collection-save-button"]');
  await saveButton.click();

  // Weryfikacja - dialog powinien się zamknąć
  await expect(dialog).not.toBeVisible();
});
```

## Dostępne atrybuty data-test-id

### Sidebar (`src/components/layout/Sidebar.tsx`)
- `data-test-id="sidebar"` - główny kontener sidebar
- `data-test-id="sidebar-navigation"` - kontener nawigacji
- `data-test-id="sidebar-nav-{path}"` - linki nawigacyjne (np. `sidebar-nav-dashboard`, `sidebar-nav-tasks`)
- `data-test-id="sidebar-logout-button"` - przycisk wylogowania

### Dialog (`src/components/ui/dialog.tsx`)
- `data-test-id="dialog-overlay"` - overlay dialogu
- `data-test-id="dialog-content"` - główna zawartość dialogu
- `data-test-id="dialog-header"` - nagłówek dialogu
- `data-test-id="dialog-title"` - tytuł dialogu
- `data-test-id="dialog-footer"` - stopka dialogu
- `data-test-id="dialog-close-button"` - przycisk zamknięcia

### Button (`src/components/ui/button.tsx`)
- `data-test-id="button"` - domyślny (jeśli nie podano)
- Można nadpisać przez prop `data-test-id` (np. `data-test-id="collection-create-button"`)

### Input (`src/components/ui/input.tsx`)
- `data-test-id="input-{id}"` - automatyczny na podstawie `id` (np. `input-collection-name`)
- Można nadpisać przez prop `data-test-id`

### Label (`src/components/ui/label.tsx`)
- `data-test-id="label-{htmlFor}"` - automatyczny na podstawie `htmlFor` (np. `label-collection-name`)
- Można nadpisać przez prop `data-test-id`

### CreateCollectionDialog (`src/components/collections/CreateCollectionDialog.tsx`)
- `data-test-id="collection-create-button"` - przycisk otwierający dialog
- `data-test-id="collection-dialog"` - główny dialog
- `data-test-id="collection-dialog-title"` - tytuł dialogu
- `data-test-id="collection-dialog-description"` - opis dialogu
- `data-test-id="collection-form"` - formularz
- `data-test-id="collection-name-label"` - label nazwy
- `data-test-id="collection-name-input"` - input nazwy
- `data-test-id="collection-description-label"` - label opisu
- `data-test-id="collection-description-input"` - input opisu
- `data-test-id="collection-error-message"` - komunikat błędu
- `data-test-id="collection-cancel-button"` - przycisk anuluj
- `data-test-id="collection-save-button"` - przycisk zapisz

## Wzorce użycia

### Podstawowe selektory

```typescript
// Sidebar
const sidebar = page.locator('[data-test-id="sidebar"]');

// Przycisk w sidebarze
const createButton = page.locator('[data-test-id="collection-create-button"]');

// Dialog
const dialog = page.locator('[data-test-id="collection-dialog"]');

// Inputy
const nameInput = page.locator('[data-test-id="collection-name-input"]');
const descriptionInput = page.locator('[data-test-id="collection-description-input"]');

// Przyciski akcji
const saveButton = page.locator('[data-test-id="collection-save-button"]');
const cancelButton = page.locator('[data-test-id="collection-cancel-button"]');
```

### Oczekiwanie na elementy

```typescript
// Oczekiwanie na widoczność
await expect(dialog).toBeVisible();

// Oczekiwanie na tekst
await expect(dialogTitle).toHaveText('Utwórz nową kolekcję');

// Oczekiwanie na ukrycie
await expect(dialog).not.toBeVisible();
```

### Interakcje

```typescript
// Kliknięcie
await createButton.click();

// Wypełnienie pola
await nameInput.fill('Nazwa kolekcji');

// Weryfikacja wartości
await expect(nameInput).toHaveValue('Nazwa kolekcji');
```

## Best Practices

1. **Używaj semantycznych nazw**: `collection-create-button` zamiast `btn1`
2. **Zachowaj spójność**: używaj tego samego wzorca nazewnictwa w całej aplikacji
3. **Unikaj zależności od CSS**: nie używaj selektorów CSS do testów, tylko `data-test-id`
4. **Testuj user flow**: testuj całe scenariusze użytkownika, nie tylko pojedyncze komponenty
5. **Czekaj na elementy**: zawsze używaj `await expect().toBeVisible()` przed interakcją

## Integracja z istniejącymi komponentami

Wszystkie komponenty UI (Button, Input, Label, Dialog) mają automatyczne generowanie `data-test-id` na podstawie:
- `id` dla Input i Label
- `data-test-id` prop (nadpisuje domyślne)

Możesz również ręcznie dodać `data-test-id` do każdego komponentu:

```tsx
<Button data-test-id="custom-button-id">Kliknij</Button>
<Input id="my-input" data-test-id="custom-input-id" />
```
