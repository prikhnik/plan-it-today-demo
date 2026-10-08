// @ts-check
// Measures the built demo: bytes and time to the first screen, and the theme switch.
// Usage: corepack pnpm --filter mini-app build && corepack pnpm --filter mini-app measure [out-dir]
// MEASURE_DIST=<dir> measures another build; MEASURE_CERT/MEASURE_KEY=<pem> serve over HTTPS + HTTP/2, like Vercel.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const OUT = resolve(process.argv[2] ?? join(tmpdir(), 'pit-measure'));
const FRAMES_MS = [0, 50, 100, 150, 250, 400, 700, 1200, 2000];

const PROFILES = [
  {
    name: 'mobile-4g',
    viewport: { width: 360, height: 740 },
    mobile: true,
    network: { latency: 150, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (1 * 1024 * 1024) / 8 },
  },
  {
    name: 'mobile-slow-3g',
    viewport: { width: 360, height: 740 },
    mobile: true,
    network: { latency: 2000, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 },
  },
  { name: 'desktop', viewport: { width: 1280, height: 800 }, mobile: false, network: null },
];

const SEED_PROFILE = JSON.stringify({ introSeen: true, termsAcceptedVersion: '9.9', theme: 'light' });

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

async function measure(browser, baseUrl, profile) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: profile.viewport,
    isMobile: profile.mobile,
    hasTouch: profile.mobile,
    deviceScaleFactor: profile.mobile ? 3 : 1,
    colorScheme: 'light',
  });
  await context.addInitScript((seed) => {
    if (!localStorage.getItem('pit:profile')) localStorage.setItem('pit:profile', seed);
  }, SEED_PROFILE);

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (profile.network) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...profile.network });

  let bytes = 0;
  const inflight = new Set();
  cdp.on('Network.requestWillBeSent', (event) => inflight.add(event.requestId));
  cdp.on('Network.loadingFailed', (event) => inflight.delete(event.requestId));
  cdp.on('Network.loadingFinished', (event) => {
    inflight.delete(event.requestId);
    bytes += event.encodedDataLength;
  });
  const networkIdle = async () => {
    for (let quiet = 0; quiet < 6; quiet = inflight.size ? 0 : quiet + 1) await wait(100);
  };

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 180_000 });
  const firstScreen = await page.evaluate(() => {
    const entries = /** @type {PerformanceResourceTiming[]} */ (performance.getEntriesByType('resource'));
    const paint = performance.getEntriesByName('first-contentful-paint')[0];
    return {
      requests: entries.length + 1,
      fcp: Math.round(paint?.startTime ?? 0),
      complete: Math.round(Math.max(...entries.map((entry) => entry.responseEnd))),
    };
  });
  const firstScreenBytes = bytes;
  const dir = join(OUT, profile.name);
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: join(dir, 'first-screen.png') });

  // A real session keeps what it has loaded: only the first screen is measured with a cold cache.
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  bytes = 0;
  await page.evaluate(() => {
    performance.clearResourceTimings();
    const observer = new MutationObserver(() => {
      performance.mark('theme-class');
      observer.disconnect();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    performance.mark('theme-click');
  });
  await page.click('.greeting__theme');
  let previous = 0;
  for (const at of FRAMES_MS) {
    await wait(at - previous);
    previous = at;
    await page.screenshot({ path: join(dir, `switch-${String(at).padStart(4, '0')}ms.png`) });
  }
  await networkIdle();
  const themeSwitch = await page.evaluate(() => {
    const clickAt = performance.getEntriesByName('theme-click')[0].startTime;
    const classAt = performance.getEntriesByName('theme-class')[0]?.startTime ?? clickAt;
    const resources = /** @type {PerformanceResourceTiming[]} */ (performance.getEntriesByType('resource'));
    const images = resources.filter((entry) => entry.initiatorType !== 'fetch');
    const lastImage = Math.max(classAt, ...images.map((entry) => entry.responseEnd));
    return {
      requests: images.length,
      classChange: Math.round(classAt - clickAt),
      imagesReady: Math.round(lastImage - clickAt),
      withoutImages: Math.round(lastImage - classAt),
      late: images.filter((entry) => entry.responseEnd > classAt).map((entry) => entry.name.split('/').pop()),
    };
  });

  await context.close();
  return {
    profile: profile.name,
    firstScreen: { ...firstScreen, kb: Math.round(firstScreenBytes / 1024) },
    themeSwitch: { ...themeSwitch, kb: Math.round(bytes / 1024) },
  };
}

const { MEASURE_DIST, MEASURE_CERT, MEASURE_KEY } = process.env;
const https =
  MEASURE_CERT && MEASURE_KEY ? { cert: await readFile(MEASURE_CERT), key: await readFile(MEASURE_KEY) } : undefined;
const server = await preview({
  build: MEASURE_DIST ? { outDir: resolve(MEASURE_DIST) } : undefined,
  preview: { port: 4179, strictPort: true, https },
  logLevel: 'silent',
});
const browser = await chromium.launch();
const results = [];
try {
  for (const profile of PROFILES)
    results.push(await measure(browser, `${https ? 'https' : 'http'}://localhost:4179/`, profile));
} finally {
  await browser.close();
  await server.close();
}

await writeFile(join(OUT, 'results.json'), JSON.stringify(results, null, 2));
console.table(
  results.map(({ profile, firstScreen, themeSwitch }) => ({
    profile,
    'first KB': firstScreen.kb,
    'first req': firstScreen.requests,
    'FCP ms': firstScreen.fcp,
    'first ready ms': firstScreen.complete,
    'switch KB': themeSwitch.kb,
    'class ms': themeSwitch.classChange,
    'images ready ms': themeSwitch.imagesReady,
    'no-images ms': themeSwitch.withoutImages,
  })),
);
console.log(`Frames and results: ${OUT}`);
