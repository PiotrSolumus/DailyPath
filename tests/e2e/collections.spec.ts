import { test, expect } from "@playwright/test";

/**
 * E2E test for task creation scenario
 *
 * Scenario:
 * 1. Otwórz sidebar
 * 2. Kliknij w przycisk nowego zadania
 * 3. Poczekaj na otwarty dialog
 * 4. Wypełnij nowe zadanie
 * 5. Zapisz zadanie
 */
test.describe("Task Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Sprawdzamy, czy użytkownik jest już zalogowany
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Jeśli jesteśmy na stronie logowania, oznacza to, że użytkownik nie jest zalogowany
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      // Czekamy na formularz logowania
      await page.waitForSelector("form", { state: "visible", timeout: 10000 });

      // Wypełniamy formularz logowania
      await page.fill('input[type="email"]', "admin@test.com");
      await page.fill('input[type="password"]', "test123test");

      // Klikamy przycisk logowania i czekamy na przekierowanie
      const navigationPromise = page.waitForURL("**/dashboard", { timeout: 20000 });
      const responsePromise = page
        .waitForResponse((response) => response.url().includes("/api/auth/login") && response.status() === 200, {
          timeout: 20000,
        })
        .catch(() => {
          // Ignorujemy błędy odpowiedzi, jeśli przekierowanie nastąpi
        });

      await page.click('button[type="submit"]');

      // Czekamy na odpowiedź API i przekierowanie
      await Promise.all([navigationPromise, responsePromise]);

      // Upewniamy się, że jesteśmy na dashboard (nie na /login)
      await page.waitForURL("**/dashboard", { timeout: 10000 });

      // Czekamy na pełne załadowanie dashboard i ustawienie użytkownika w middleware
      // Middleware musi przetworzyć sesję i ustawić locals.user
      await page.waitForTimeout(1000);

      // Weryfikujemy, że użytkownik jest ustawiony poprzez wywołanie API /api/users/me
      // To zapewnia, że middleware poprawnie przetworzył sesję i ustawił użytkownika
      const userResponse = await page.request.get("/api/users/me");
      if (userResponse.status() !== 200) {
        const errorBody = await userResponse.text();
        throw new Error(
          `User was not properly authenticated after login. /api/users/me returned ${userResponse.status()}: ${errorBody}`
        );
      }

      const userData = await userResponse.json();
      if (!userData || !userData.id || !userData.email) {
        throw new Error(`User data is incomplete after login: ${JSON.stringify(userData)}`);
      }

      // Sprawdzamy czy email użytkownika odpowiada zalogowanemu użytkownikowi
      if (userData.email !== "admin@test.com") {
        throw new Error(`Logged in user email mismatch. Expected admin@test.com, got ${userData.email}`);
      }
    }

    // Upewniamy się, że jesteśmy na dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Wait for sidebar to be visible (React component needs to hydrate)
    // Sidebar wymaga użytkownika, więc jeśli się pojawi, oznacza to że użytkownik jest ustawiony
    await page.waitForSelector('[data-test-id="sidebar"]', { state: "visible", timeout: 10000 });

    // Dodatkowe czekanie na pełne załadowanie komponentów React i ustawienie kontekstu użytkownika
    await page.waitForTimeout(500);
  });

  test("should create a new task", async ({ page }) => {
    // beforeEach already ensures we're on dashboard and logged in
    // Just verify we're still on the correct page
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // 1. Otwórz sidebar
    const sidebar = page.locator('[data-test-id="sidebar"]');
    await expect(sidebar).toBeVisible();

    // 2. Kliknij w przycisk nowego zadania
    const createButton = page.locator('[data-test-id="task-create-button"]');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await expect(createButton).toBeEnabled();
    // Czekamy na stabilność przycisku (React hydration)
    await page.waitForTimeout(500);
    await createButton.click();

    // 3. Poczekaj na otwarty dialog - czekamy bezpośrednio na content
    const dialog = page.locator('[data-test-id="task-dialog"], [data-test-id="dialog-content"]').first();
    await expect(dialog).toBeVisible({ timeout: 20000 });

    const dialogTitle = page.locator('[data-test-id="task-dialog-title"]');
    await expect(dialogTitle).toHaveText("Nowe zadanie", { timeout: 10000 });

    // 4. Wypełnij nowe zadanie
    const titleInput = page.locator('[data-test-id="task-title-input"]');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill("Moje pierwsze zadanie");

    const descriptionInput = page.locator('[data-test-id="task-description-input"]');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill("Opis mojego zadania");

    // Weryfikacja wypełnionych pól
    await expect(titleInput).toHaveValue("Moje pierwsze zadanie");
    await expect(descriptionInput).toHaveValue("Opis mojego zadania");

    // Wypełnij wymagane pole użytkownika (pole jest wymagane)
    const userSelect = page.locator("#assigned_user");
    await expect(userSelect).toBeVisible({ timeout: 10000 });

    // Czekamy na załadowanie użytkowników - sprawdzamy czy są opcje poza pustą
    // Czekamy aż będzie co najmniej 2 opcje (pusta + przynajmniej jeden użytkownik)
    await page.waitForFunction(
      () => {
        const select = document.querySelector("#assigned_user") as HTMLSelectElement | null;
        return select !== null && select.options.length >= 2;
      },
      { timeout: 10000 }
    );

    // Wybierz pierwszego użytkownika (pomijamy opcję "-- Wybierz użytkownika --")
    // Używamy wartości zamiast indexu dla większej niezawodności
    const firstUserOption = userSelect.locator("option").nth(1);
    const firstUserId = await firstUserOption.getAttribute("value");
    if (firstUserId && firstUserId !== "") {
      await userSelect.selectOption(firstUserId);
    } else {
      // Fallback do indexu jeśli nie ma wartości
      await userSelect.selectOption({ index: 1 });
    }

    // Weryfikacja wyboru użytkownika - upewniamy się że nie jest puste
    await expect(userSelect).not.toHaveValue("", { timeout: 5000 });

    // Czekamy na pełną synchronizację formularza React po wyborze użytkownika
    // Formularz musi zaktualizować stan assigned_id przed zapisem
    // Dodatkowe czekanie na stabilizację formularza i upewnienie się że React zaktualizował stan
    await page.waitForTimeout(1000);

    // 5. Weryfikuj sesję tuż przed zapisem (sesja może wygasnąć podczas wypełniania formularza)
    // To zapewnia, że cookies są prawidłowo przekazywane w żądaniu POST
    const authCheckResponse = await page.request.get("/api/users/me");
    if (authCheckResponse.status() !== 200) {
      // Sesja wygasła - ponownie zaloguj użytkownika
      // Zapisujemy dane formularza przed re-autentykacją
      const formData = {
        title: await titleInput.inputValue(),
        description: await descriptionInput.inputValue(),
        userId: await userSelect.inputValue(),
      };

      // Przejdź na login (dialog zamknie się automatycznie)
      await page.goto("/login", { waitUntil: "networkidle" });
      await page.waitForSelector("form", { state: "visible", timeout: 10000 });
      await page.fill('input[type="email"]', "admin@test.com");
      await page.fill('input[type="password"]', "test123test");
      const navigationPromise = page.waitForURL("**/dashboard", { timeout: 20000 });
      await page.click('button[type="submit"]');
      await navigationPromise;
      await page.waitForTimeout(1000);

      // Weryfikuj ponownie autoryzację
      const reAuthResponse = await page.request.get("/api/users/me");
      if (reAuthResponse.status() !== 200) {
        throw new Error("Failed to re-authenticate before task creation");
      }

      // Otwórz dialog ponownie i wypełnij formularz
      const createButtonAfterAuth = page.locator('[data-test-id="task-create-button"]');
      await expect(createButtonAfterAuth).toBeVisible({ timeout: 10000 });
      await createButtonAfterAuth.click();

      const dialogAfterAuth = page.locator('[data-test-id="task-dialog"], [data-test-id="dialog-content"]').first();
      await expect(dialogAfterAuth).toBeVisible({ timeout: 20000 });

      const titleInputAfterAuth = page.locator('[data-test-id="task-title-input"]');
      await expect(titleInputAfterAuth).toBeVisible({ timeout: 10000 });
      await titleInputAfterAuth.fill(formData.title);

      const descriptionInputAfterAuth = page.locator('[data-test-id="task-description-input"]');
      await expect(descriptionInputAfterAuth).toBeVisible();
      await descriptionInputAfterAuth.fill(formData.description);

      const userSelectAfterAuth = page.locator("#assigned_user");
      await expect(userSelectAfterAuth).toBeVisible({ timeout: 10000 });
      await page.waitForFunction(
        () => {
          const select = document.querySelector("#assigned_user") as HTMLSelectElement | null;
          return select !== null && select.options.length >= 2;
        },
        { timeout: 10000 }
      );

      if (formData.userId) {
        await userSelectAfterAuth.selectOption(formData.userId);
      } else {
        const firstUserOption = userSelectAfterAuth.locator("option").nth(1);
        const firstUserId = await firstUserOption.getAttribute("value");
        if (firstUserId && firstUserId !== "") {
          await userSelectAfterAuth.selectOption(firstUserId);
        } else {
          await userSelectAfterAuth.selectOption({ index: 1 });
        }
      }

      await expect(userSelectAfterAuth).not.toHaveValue("", { timeout: 5000 });
      await page.waitForTimeout(1000);
    }

    // Zapisz zadanie
    const saveButton = page.locator('[data-test-id="task-save-button"]');
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await expect(saveButton).toBeEnabled();

    // Czekamy aż przycisk zapisz będzie w stanie gotowym (nie pending/loading)
    // To zapewnia że formularz jest w pełni zsynchronizowany
    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-test-id="task-save-button"]') as HTMLButtonElement | null;
        return button !== null && !button.disabled && button.textContent?.trim() !== "Tworzenie...";
      },
      { timeout: 5000 }
    );

    // Czekamy na zakończenie requestu po zapisaniu (niezależnie od statusu)
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tasks") && response.request().method() === "POST",
      {
        timeout: 15000,
      }
    );

    await saveButton.click();

    // Czekamy na zakończenie requestu
    const response = await responsePromise;

    // Sprawdzamy, czy odpowiedź jest sukcesem
    if (response.status() !== 201) {
      // Jeśli nie jest sukcesem, sprawdzamy czy dialog się zamknął mimo błędu
      // (może być problem z autentykacją, ale dialog powinien się zamknąć po błędzie)
      const responseBody = await response.text();
      console.warn(`API returned status ${response.status()}: ${responseBody}`);
      // Jeśli API zwróciło błąd, dialog może pozostać otwarty - to jest oczekiwane zachowanie
      // W takim przypadku test powinien zakończyć się błędem, bo zadanie nie zostało utworzone
      throw new Error(`Failed to create task: API returned status ${response.status()}: ${responseBody}`);
    }

    // Czekamy na zakończenie mutacji (przycisk nie jest już w stanie "pending")
    await expect(saveButton).not.toHaveText("Tworzenie...", { timeout: 10000 });

    // Czekamy na zamknięcie dialogu tylko jeśli API zwróciło sukces
    // Radix UI Dialog zmienia data-state z "open" na "closed" lub jest usuwany z DOM
    // Sprawdzamy zarówno stan dialogu jak i jego widoczność
    try {
      await page.waitForFunction(
        () => {
          const dialogElement = document.querySelector('[data-test-id="task-dialog"]') as HTMLElement | null;
          if (!dialogElement) return true; // Dialog został usunięty z DOM
          const state = dialogElement.getAttribute("data-state");
          return state === "closed";
        },
        { timeout: 15000 }
      );
    } catch {
      // Fallback: jeśli waitForFunction nie zadziała, sprawdzamy widoczność
      // Dialog może być już usunięty z DOM
    }

    // Sprawdzamy, czy dialog nie jest widoczny (może być usunięty z DOM lub mieć state="closed")
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test("should cancel task creation", async ({ page }) => {
    const sidebar = page.locator('[data-test-id="sidebar"]');
    await expect(sidebar).toBeVisible();

    const createButton = page.locator('[data-test-id="task-create-button"]');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await expect(createButton).toBeEnabled();
    await page.waitForTimeout(500);
    await createButton.click();

    // Czekamy na dialog - czekamy bezpośrednio na content
    const dialog = page.locator('[data-test-id="task-dialog"], [data-test-id="dialog-content"]').first();
    await expect(dialog).toBeVisible({ timeout: 20000 });

    // Wypełnij pola
    await page.locator('[data-test-id="task-title-input"]').fill("Testowe zadanie");
    await page.locator('[data-test-id="task-description-input"]').fill("Testowy opis");

    // Anuluj
    const cancelButton = page.locator('[data-test-id="task-cancel-button"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Dialog powinien się zamknąć
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Pola powinny być puste przy ponownym otwarciu
    await page.waitForTimeout(500);
    await createButton.click();
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-test-id="task-title-input"]')).toHaveValue("");
    await expect(page.locator('[data-test-id="task-description-input"]')).toHaveValue("");
  });

  test("should show error for empty task title", async ({ page }) => {
    const sidebar = page.locator('[data-test-id="sidebar"]');
    await expect(sidebar).toBeVisible();

    const createButton = page.locator('[data-test-id="task-create-button"]');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await expect(createButton).toBeEnabled();
    await page.waitForTimeout(500);
    await createButton.click();

    // Czekamy na dialog - czekamy bezpośrednio na content
    const dialog = page.locator('[data-test-id="task-dialog"], [data-test-id="dialog-content"]').first();
    await expect(dialog).toBeVisible({ timeout: 20000 });

    // Próba zapisania bez nazwy (pole wymagane)
    const saveButton = page.locator('[data-test-id="task-save-button"]');
    await expect(saveButton).toBeVisible({ timeout: 10000 });

    // HTML5 validation powinno zapobiec submitowi
    const titleInput = page.locator('[data-test-id="task-title-input"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveAttribute("required");

    // Próba kliknięcia zapisz - formularz nie powinien się wysłać
    await saveButton.click();

    // Dialog powinien nadal być widoczny (formularz nie został wysłany)
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("should close dialog using close button", async ({ page }) => {
    const sidebar = page.locator('[data-test-id="sidebar"]');
    await expect(sidebar).toBeVisible();

    const createButton = page.locator('[data-test-id="task-create-button"]');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await expect(createButton).toBeEnabled();
    await page.waitForTimeout(500);
    await createButton.click();

    // Czekamy na dialog - czekamy bezpośrednio na content
    const dialog = page.locator('[data-test-id="task-dialog"], [data-test-id="dialog-content"]').first();
    await expect(dialog).toBeVisible({ timeout: 20000 });

    // Zamknij przez przycisk X
    const closeButton = page.locator('[data-test-id="dialog-close-button"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();

    // Dialog powinien się zamknąć
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });
});
