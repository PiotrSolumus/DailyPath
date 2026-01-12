import { test as base } from "@playwright/test";

/**
 * Custom fixtures for E2E tests
 * Extend this to add custom fixtures like authenticated user context
 */

interface TestFixtures {
  // Add custom fixtures here
  // authenticatedUser: { page: Page; user: User };
}

export const test = base.extend<TestFixtures>({
  // Example fixture:
  // authenticatedUser: async ({ page }, use) => {
  //   // Setup authenticated user
  //   await page.goto('/login');
  //   await page.fill('[name="email"]', 'test@example.com');
  //   await page.fill('[name="password"]', 'password123');
  //   await page.click('button[type="submit"]');
  //   await page.waitForURL('/dashboard');
  //   await use({ page, user: { email: 'test@example.com' } });
  // },
});

export { expect } from "@playwright/test";
