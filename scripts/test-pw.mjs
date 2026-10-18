import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const title = await page.title();
  console.log('Page title:', title);
  await browser.close();
}

main().catch(err => {
  console.error('Playwright launch error:', err);
  process.exit(1);
});
