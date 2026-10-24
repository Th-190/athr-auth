import { expect, test } from '@playwright/test';

test('high contrast applies immediately and persists when the modal is reopened and the page reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'راحة القراءة', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'تفضيلات القراءة والعرض' });
  const contrastSwitch = dialog.getByRole('switch', { name: 'نمط عالي التباين' });
  await expect(contrastSwitch).toHaveAttribute('aria-checked', 'false');
  await contrastSwitch.click();

  await expect(contrastSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-reading-contrast="high"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kha_reading_preferences')))
    .toContain('"highContrast":true');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'راحة القراءة', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'نمط عالي التباين' })).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  await expect(page.locator('[data-reading-contrast="high"]')).toBeVisible();
  await page.getByRole('button', { name: 'راحة القراءة', exact: true }).click();
  const reloadedSwitch = page.getByRole('switch', { name: 'نمط عالي التباين' });
  await expect(reloadedSwitch).toHaveAttribute('aria-checked', 'true');
  await reloadedSwitch.click();
  await expect(reloadedSwitch).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('[data-reading-contrast="standard"]')).toBeVisible();
});

test('failed preference persistence leaves the saved setting and visible control unchanged', async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'kha_reading_preferences') throw new DOMException('Storage unavailable', 'QuotaExceededError');
      return originalSetItem.call(this, key, value);
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'راحة القراءة', exact: true }).click();
  const contrastSwitch = page.getByRole('switch', { name: 'نمط عالي التباين' });
  await contrastSwitch.click();

  await expect(contrastSwitch).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('alert')).toContainText('تعذّر حفظ التفضيل');
  await expect(page.locator('[data-reading-contrast="standard"]')).toBeVisible();
});

test('settings dialog traps keyboard focus and closes from the backdrop', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'راحة القراءة', exact: true });
  await opener.focus();
  await opener.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'تفضيلات القراءة والعرض' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'إغلاق تفضيلات القراءة' })).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'إغلاق' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'إغلاق تفضيلات القراءة' })).toBeFocused();

  await page.locator('[role="dialog"]').click({ position: { x: 4, y: 4 } });
  await expect(dialog).toHaveCount(0);
});
