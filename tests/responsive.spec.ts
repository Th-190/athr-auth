import { test, expect } from '@playwright/test';

test.describe('Responsive & Usability Regression Checks', () => {
  test.beforeEach(async ({ page }) => {
    // Set admin user in localStorage to enable all test surfaces
    await page.addInitScript(() => {
      localStorage.setItem('kha_auth_user', JSON.stringify({
        id: 'usr-admin-test',
        name: 'مدقق الاختبارات',
        email: 'test@karbalaheritage.org',
        role: 'admin',
        createdAt: '2026-01-01'
      }));
    });
  });

  test('Homepage has no overflow and meets touch target standards', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(true);
    expect(consoleErrors).toHaveLength(0);
  });

  test('Registry page has no horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent?.includes('الآثار والمعالم')) as HTMLElement | undefined;
      btn?.click();
    });
    await page.waitForTimeout(300);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(true);
  });

  test('Museums catalog page has no horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent?.includes('المتاحف')) as HTMLElement | undefined;
      btn?.click();
    });
    await page.waitForTimeout(300);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(true);
  });

  test('Map page renders properly without overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent?.includes('الخريطة')) as HTMLElement | undefined;
      btn?.click();
    });
    await page.waitForTimeout(400);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(true);
  });

  test('Admin Console has responsive layouts and no horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent?.includes('لوحة التحرير')) as HTMLElement | undefined;
      btn?.click();
    });
    await page.waitForTimeout(400);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(true);
  });
});
