import { expect, test } from '@playwright/test'

// Etapa 0 smoke: Laravel servira stranicu i Vue/Inertia se mounta.
test('welcome stranica se učitava i rendera Vue aplikaciju', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#app')).toBeAttached()
})
