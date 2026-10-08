// @ts-check
import { getColorScheme, onTelegramThemeChange, setChromeColor } from './telegram.js';

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const VEIL_MS = 150;
const LOAD_TIMEOUT_MS = 1500;
let preference = 'system';
let switching = Promise.resolve();

const assets = readCriticalAssets();

function readCriticalAssets() {
  try {
    return JSON.parse(document.getElementById('critical-assets').textContent);
  } catch {
    return null;
  }
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const getAppliedTheme = () => (document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light');

export function resolveTheme(value) {
  if (value === 'light' || value === 'dark') return value;
  return getColorScheme() ?? (systemDark.matches ? 'dark' : 'light');
}

export function applyTheme(value = preference) {
  preference = value;
  const theme = resolveTheme(value);
  const root = document.documentElement;
  root.classList.toggle('theme-light', theme === 'light');
  root.classList.toggle('theme-dark', theme === 'dark');
  setChromeColor(getComputedStyle(root).getPropertyValue('--bg-paper').trim());
  return theme;
}

function loadImage(url, cors) {
  const image = new Image();
  if (cors) image.crossOrigin = 'anonymous';
  image.src = url;
  return image.decode();
}

function loadThemeImages(theme) {
  const set = assets?.[theme];
  if (!set) return Promise.resolve();
  return Promise.allSettled([
    ...[...set.critical, ...set.extra].map((url) => loadImage(url, false)),
    ...set.masks.map((url) => loadImage(url, true)),
  ]);
}

async function runSwitch(value, onApplied) {
  const next = resolveTheme(value);
  if (next === getAppliedTheme()) {
    applyTheme(value);
    onApplied?.();
    return;
  }

  const veil = document.createElement('div');
  veil.className = `theme-veil theme-${next}`;
  document.body.append(veil);
  const ready = Promise.race([loadThemeImages(next), wait(LOAD_TIMEOUT_MS)]);
  veil.getBoundingClientRect();
  veil.classList.add('theme-veil--visible');

  await Promise.all([ready, wait(VEIL_MS)]);
  applyTheme(value);
  onApplied?.();
  veil.addEventListener('transitionend', () => veil.remove(), { once: true });
  setTimeout(() => veil.remove(), VEIL_MS * 3);
  veil.classList.remove('theme-veil--visible');
}

/**
 * Covers the screen with the new paper colour while the new theme's pencil assets load and decode,
 * then reveals the screen already drawn in the new theme.
 */
export function switchTheme(value, onApplied) {
  switching = switching.then(() => runSwitch(value, onApplied));
  return switching;
}

export function watchSystemTheme(onApplied) {
  const update = () => preference === 'system' && switchTheme('system', onApplied);
  systemDark.addEventListener('change', update);
  onTelegramThemeChange(update);
}
