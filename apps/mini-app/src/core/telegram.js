// @ts-check
const webApp = window.Telegram?.WebApp;

export const isTelegram = Boolean(webApp?.initData);

const supports = (version) => isTelegram && webApp.isVersionAtLeast(version);

export function initTelegram() {
  if (!isTelegram) return;
  webApp.ready();
  webApp.expand();
  if (supports('7.7')) webApp.disableVerticalSwipes();
}

export function getColorScheme() {
  return isTelegram ? webApp.colorScheme : null;
}

export function onTelegramThemeChange(handler) {
  if (isTelegram) webApp.onEvent('themeChanged', handler);
}

export function setChromeColor(color) {
  if (!supports('6.1')) return;
  webApp.setHeaderColor(color);
  webApp.setBackgroundColor(color);
  if (supports('7.10')) webApp.setBottomBarColor(color);
}

export function setBackButton(visible, handler) {
  if (!supports('6.1')) return;
  webApp.BackButton.offClick(handler);
  if (visible) {
    webApp.BackButton.onClick(handler);
    webApp.BackButton.show();
  } else {
    webApp.BackButton.hide();
  }
}

/** @returns {{ id: number, first_name: string, last_name?: string, username?: string } | null} */
export function getTelegramUser() {
  return isTelegram ? (webApp.initDataUnsafe?.user ?? null) : null;
}

export function openLink(url) {
  if (isTelegram) webApp.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

export const canAddToHomeScreen = () => supports('8.0') && typeof webApp.addToHomeScreen === 'function';

export function addToHomeScreen() {
  if (canAddToHomeScreen()) webApp.addToHomeScreen();
}

/** Light tap for marks, success for finished quests. */
export function haptic(kind) {
  if (!supports('6.1')) return;
  if (kind === 'success') webApp.HapticFeedback.notificationOccurred('success');
  else webApp.HapticFeedback.impactOccurred('light');
}
