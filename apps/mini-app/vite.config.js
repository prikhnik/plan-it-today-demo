// @ts-check
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { FONTS, getCriticalImages, getExtraImages, getMaskImages } from './src/core/critical-assets.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf-8'));
/** @type {Record<string, string>} Headers Vercel sends with every page; `vite preview` sends the same. */
const pageHeaders = Object.fromEntries(
  vercel.headers.find((rule) => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]),
);

/** Short commit + build date, shown in «Про застосунок» to tell testers' versions apart. */
function getBuildLabel() {
  let commit = process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    commit ??= execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    commit = 'local';
  }
  const [year, month, day] = new Date().toISOString().slice(0, 10).split('-');
  return `${commit.trim().slice(0, 7)} від ${day}.${month}.${year}`;
}

/** @type {('light' | 'dark')[]} */
const THEMES = ['light', 'dark'];

/**
 * Replaces __CRITICAL_ASSETS__ in index.html with the built URLs of the critical theme assets.
 * @returns {import('vite').Plugin}
 */
function criticalAssets() {
  return {
    name: 'critical-assets',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        const emitted = new Map();
        Object.values(bundle ?? {})
          .filter((file) => file.type === 'asset')
          .forEach((file) => file.originalFileNames.forEach((name) => emitted.set(name, `./${file.fileName}`)));

        const toUrl = (path) => {
          const source = `src/assets/${path}`;
          if (!bundle) return `/${source}`;
          if (!emitted.has(source)) throw new Error(`Critical asset is not in the bundle: ${source}`);
          return emitted.get(source);
        };

        const manifest = { fonts: FONTS.map(toUrl) };
        THEMES.forEach((theme) => {
          manifest[theme] = {
            critical: getCriticalImages(theme).map(toUrl),
            extra: getExtraImages(theme).map(toUrl),
            masks: getMaskImages(theme).map(toUrl),
          };
        });
        return html.replace('__CRITICAL_ASSETS__', JSON.stringify(manifest));
      },
    },
  };
}

/**
 * The theme bootstrap is an inline script: CSP in vercel.json allows it by hash.
 * The build fails if the script changed and the hash in vercel.json did not.
 * @returns {import('vite').Plugin}
 */
function cspInlineScripts() {
  return {
    name: 'csp-inline-scripts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const csp = pageHeaders['Content-Security-Policy'];
        const inline = [...html.matchAll(/<script(?![^>]*\b(?:src|type)=)[^>]*>([\s\S]*?)<\/script>/g)];
        inline.forEach(([, code]) => {
          const hash = `'sha256-${createHash('sha256').update(code).digest('base64')}'`;
          if (!csp.includes(hash)) {
            throw new Error(`Inline script changed: put ${hash} into script-src of vercel.json`);
          }
        });
        return html;
      },
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0,
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_BUILD__: JSON.stringify(getBuildLabel()),
  },
  plugins: [criticalAssets(), cspInlineScripts()],
  preview: {
    headers: pageHeaders,
  },
  resolve: {
    alias: {
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  server: {
    host: true,
  },
});
