import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'phone-360x640', width: 360, height: 640, device: 'Small Phone' },
  { name: 'phone-390x844', width: 390, height: 844, device: 'iPhone 12/13/14' },
  { name: 'phone-430x932', width: 430, height: 932, device: 'iPhone Pro Max' },
  { name: 'ipad-portrait-768x1024', width: 768, height: 1024, device: 'iPad Portrait' },
  { name: 'ipad-landscape-1024x768', width: 1024, height: 768, device: 'iPad Landscape' },
  { name: 'tablet-820x1180', width: 820, height: 1180, device: 'iPad Air/Pro' },
  { name: 'desktop-1280x800', width: 1280, height: 800, device: 'Compact Desktop / Mac 13"' },
  { name: 'desktop-1440x900', width: 1440, height: 900, device: 'Standard Laptop' },
  { name: 'desktop-1920x1080', width: 1920, height: 1080, device: 'FHD Desktop' },
];

const PHASE = process.argv[2] || 'after';
const OUTPUT_DIR = path.resolve(`tests/screenshots/${PHASE}`);
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function runAudit() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const report = {
    phase: PHASE,
    timestamp: new Date().toISOString(),
    viewportsChecked: VIEWPORTS.length,
    results: []
  };

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Auditing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // Set Admin auth role in localStorage
    await page.evaluate(() => {
      localStorage.setItem('kha_auth_user', JSON.stringify({
        id: 'usr-admin-audit',
        name: 'مدقق الجودة',
        email: 'audit@karbalaheritage.org',
        role: 'admin',
        createdAt: '2026-01-01'
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // Define all requested routes/views to check per specification
    const pagesToCheck = [
      {
        id: 'home',
        name: 'الرئيسية (Home)',
        action: async () => {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.trim() === 'الرئيسية');
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'registry',
        name: 'سجل المواقع (Site List)',
        action: async () => {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('الآثار والمعالم'));
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'site_detail',
        name: 'بطاقة المعلم (Site Record)',
        action: async () => {
          await page.evaluate(() => {
            const card = document.querySelector('article, div[class*="cursor-pointer"] h3, h4');
            if (card) card.closest('[class*="cursor-pointer"]')?.click();
          });
        }
      },
      {
        id: 'map',
        name: 'الخريطة (Map)',
        action: async () => {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('الخريطة'));
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'museums',
        name: 'المتاحف (Museums)',
        action: async () => {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('المتاحف'));
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'contribute',
        name: 'المساهمة (Contribute)',
        action: async () => {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('ساهم في التوثيق') || el.textContent.includes('اقترح'));
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'login',
        name: 'تسجيل الدخول (Login)',
        action: async () => {
          // Close modal if open then trigger auth modal
          await page.evaluate(() => {
            const closeBtn = document.querySelector('button[aria-label="إغلاق"]');
            if (closeBtn) closeBtn.click();
          });
          await page.waitForTimeout(200);
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('تسجيل الدخول') || el.title?.includes('تسجيل الدخول'));
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'admin_sites',
        name: 'لوحة التحكم - السجلات (Admin Sites)',
        action: async () => {
          await page.evaluate(() => {
            const closeBtn = document.querySelector('button[aria-label="إغلاق"], button[aria-label="إغلاق النافذة"]');
            if (closeBtn) closeBtn.click();
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('لوحة التحرير'));
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'admin_leads',
        name: 'لوحة التحكم - المرشحون للبحث (Admin Leads)',
        action: async () => {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('مرشحو البحث'));
            if (btn) btn.click();
          });
        }
      },
      {
        id: 'admin_audit',
        name: 'لوحة التحكم - سجل التدقيق (Admin Audit)',
        action: async () => {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('سجل التدقيق'));
            if (btn) btn.click();
          });
        }
      },
    ];

    for (const p of pagesToCheck) {
      try {
        await p.action();
        await page.waitForTimeout(400);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const scrollW = document.documentElement.scrollWidth;
          const clientW = document.documentElement.clientWidth;
          const bodyScrollW = document.body.scrollWidth;
          const bodyClientW = document.body.clientWidth;

          // Elements wider than clientWidth outside scrollable containers
          const wideElements = [];
          const all = document.querySelectorAll('*');
          for (const el of all) {
            if (el === document.documentElement || el === document.body) continue;
            let parent = el.parentElement;
            let insideScroll = false;
            while (parent && parent !== document.body) {
              const overflowX = window.getComputedStyle(parent).overflowX;
              if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') {
                insideScroll = true;
                break;
              }
              parent = parent.parentElement;
            }
            if (insideScroll) continue;

            const rect = el.getBoundingClientRect();
            if (rect.width > clientW + 2) {
              wideElements.push({
                tag: el.tagName.toLowerCase(),
                className: (el.className || '').toString().slice(0, 80),
                width: Math.round(rect.width)
              });
            }
          }

          // Small tap targets (clickable buttons/links smaller than 44x44px)
          const smallTapTargets = [];
          const clickables = document.querySelectorAll('button, a, input, select');
          for (const el of clickables) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) {
              if (rect.width < 44 || rect.height < 44) {
                smallTapTargets.push({
                  text: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height)
                });
              }
            }
          }

          return {
            hasOverflow: scrollW > clientW + 1 || bodyScrollW > bodyClientW + 1,
            scrollWidth: scrollW,
            clientWidth: clientW,
            wideElementsCount: wideElements.length,
            wideElements: wideElements.slice(0, 5),
            smallTapTargetsCount: smallTapTargets.length,
            smallTapTargets: smallTapTargets.slice(0, 8)
          };
        });

        // Screenshot
        const screenshotFile = `${vp.name}_${p.id}.png`;
        await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotFile), fullPage: false });

        report.results.push({
          viewport: vp.name,
          dimensions: `${vp.width}x${vp.height}`,
          device: vp.device,
          pageId: p.id,
          pageName: p.name,
          overflow,
          consoleErrorsCount: consoleErrors.length,
          consoleErrors: consoleErrors.slice(0, 3),
          screenshot: screenshotFile
        });

        console.log(`  [${p.id}] Overflow: ${overflow.hasOverflow ? 'FAIL (scrollW: ' + overflow.scrollWidth + ' > clientW: ' + overflow.clientWidth + ')' : 'PASS'}, WideEls: ${overflow.wideElementsCount}, SmallTaps: ${overflow.smallTapTargetsCount}`);
      } catch (err) {
        console.error(`  Error testing ${p.id} on ${vp.name}:`, err.message);
      }
    }

    await context.close();
  }

  await browser.close();

  const reportPath = path.resolve(`docs/responsive-audit-${PHASE}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown summary
  let md = `# تقرير الفحص والاستجابة (${PHASE.toUpperCase()})\n\n`;
  md += `**تاريخ الفحص**: ${report.timestamp}\n`;
  md += `**عدد قياسات العرض المفحوصة**: ${VIEWPORTS.length}\n`;
  md += `**المعايير المعتمدة**: دقة العرض وتطابق الميزات عبر الهواتف، الأجهزة اللوحية، والشاشات المكتبية بدون فيضان أفقي أو قص نصوص.\n\n`;
  md += `| العرض والارتفاع | الجهاز | الصفحة | فيضان أفقي (Overflow) | عناصر أعرض من الشاشة | أزرار أصغر من 44px | أخطاء Console |\n`;
  md += `|---|---|---|---|---|---|---|\n`;

  for (const r of report.results) {
    const overflowStatus = r.overflow.hasOverflow ? '❌ نعم' : '✅ لا';
    md += `| ${r.dimensions} | ${r.device} | ${r.pageName} | ${overflowStatus} | ${r.overflow.wideElementsCount} | ${r.overflow.smallTapTargetsCount} | ${r.consoleErrorsCount} |\n`;
  }

  fs.writeFileSync(path.resolve(`docs/responsive-audit-${PHASE}.md`), md);
  console.log(`\nAudit saved to docs/responsive-audit-${PHASE}.md and ${reportPath}`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
