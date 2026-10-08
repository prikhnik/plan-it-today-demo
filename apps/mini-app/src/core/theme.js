import { getColorScheme, onTelegramThemeChange, setChromeColor } from './telegram.js';

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
let preference = 'system';

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

export function watchSystemTheme() {
  const update = () => preference === 'system' && applyTheme();
  systemDark.addEventListener('change', update);
  onTelegramThemeChange(update);
}
