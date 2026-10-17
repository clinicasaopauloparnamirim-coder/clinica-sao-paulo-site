import http from 'node:http';
import path from 'node:path';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = path.resolve('public');
const outputDir = path.resolve('artifacts/design-audit');
const routes = [
  '/', '/dentista-parnamirim/', '/clinica-odontologica-parnamirim/',
  '/aparelho-ortodontico-parnamirim/', '/clareamento-dental-parnamirim/',
  '/limpeza-dental-parnamirim/', '/facetas-de-resina-parnamirim/',
  '/restauracao-estetica-parnamirim/', '/tratamento-de-canal-parnamirim/'
];
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.json': 'application/json'
};
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || '/', 'http://127.0.0.1:4173');
    let pathname = decodeURIComponent(u.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, '.' + pathname);
    if (!(file === root || file.startsWith(root + path.sep))) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
await mkdir(outputDir, { recursive: true });
await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const results = [];
const failures = [];
let currentRoute = '';
page.on('pageerror', error => failures.push({ route: currentRoute, issue: 'pageerror', detail: error.message }));
try {
  for (const viewport of [
    { width: 390, height: 844, label: 'mobile' },
    { width: 768, height: 1024, label: 'tablet' },
    { width: 1440, height: 1000, label: 'desktop' }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of routes) {
      currentRoute = route;
      const response = await page.goto('http://127.0.0.1:4173' + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || !response.ok()) {
        failures.push({ route, width: viewport.width, issue: 'http-status', detail: response ? response.status() : 'no response' });
        continue;
      }
      await Promise.race([
        page.evaluate(() => document.fonts.ready.then(() => true)),
        new Promise(resolve => setTimeout(() => resolve(false), 5000))
      ]);
      await page.waitForFunction(() => {
        const img = document.querySelector('.hero-photo');
        return !!img && img.complete;
      }, null, { timeout: 20000 }).catch(() => null);
      const metrics = await page.evaluate(() => {
        const h1 = document.querySelector('main .hero h1');
        const hero = document.querySelector('main .hero');
        const cta = document.querySelector('main .hero .whatsapp-cta');
        const img = document.querySelector('main .hero .hero-photo');
        let lines = 0;
        if (h1) {
          const range = document.createRange();
          range.selectNodeContents(h1);
          lines = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0).length;
        }
        const box = el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top + window.scrollY), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
        };
        const cssLink = document.querySelector('link[href*="design-refinements.css"]');
        return {
          h1: h1 ? h1.innerText.trim() : null,
          h1Lines: lines,
          h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
          heroHeight: hero ? Math.round(hero.getBoundingClientRect().height) : null,
          primaryCta: box(cta),
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          heroImageLoaded: !!img && img.complete && img.naturalWidth > 0,
          heroImageNaturalSize: img ? [img.naturalWidth, img.naturalHeight] : null,
          heroImageAlt: img ? img.alt : null,
          designStylesheetLoaded: !!cssLink && !!cssLink.sheet,
          whatsappTargetValid: !!cta && /^https:\/\/wa\.me\/5584998947669/.test(cta.href)
        };
      });
      results.push({ route, viewport: viewport.label, width: viewport.width, ...metrics });
      if (metrics.horizontalOverflow) failures.push({ route, width: viewport.width, issue: 'horizontal-overflow', detail: metrics.documentWidth });
      if (!metrics.heroImageLoaded) failures.push({ route, width: viewport.width, issue: 'hero-image-not-loaded', detail: metrics.heroImageAlt });
      if (!metrics.designStylesheetLoaded) failures.push({ route, width: viewport.width, issue: 'design-stylesheet-not-loaded' });
      if (!metrics.whatsappTargetValid) failures.push({ route, width: viewport.width, issue: 'invalid-whatsapp-cta' });
      if (metrics.h1Lines > 2) failures.push({ route, width: viewport.width, issue: 'headline-over-two-lines', detail: metrics.h1Lines });
      if (viewport.width === 390 && (metrics.primaryCta === null || metrics.primaryCta.top > 620)) {
        failures.push({ route, width: viewport.width, issue: 'primary-cta-too-low', detail: metrics.primaryCta });
      }
      if (viewport.width === 390 || (viewport.width === 1440 && route === '/')) {
        const slug = route === '/' ? 'home' : route.split('/').filter(Boolean).join('-');
        await page.screenshot({ path: path.join(outputDir, slug + '-' + viewport.width + 'px.png'), fullPage: false });
      }
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const report = { generatedAt: new Date().toISOString(), testedRoutes: routes.length, viewportWidths: [390, 768, 1440], passed: failures.length === 0, failures, results };
await writeFile(path.resolve('design-viewport-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
