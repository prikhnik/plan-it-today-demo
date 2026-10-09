// @ts-check
import './styles/main.scss';
import { getOnboardingStep } from '@plan-it-today/shared-types';
import { renderGreeting } from './components/greeting.js';
import { renderNavbar } from './components/navbar.js';
import {
  back,
  canGoBack,
  getCurrent,
  loadScreen,
  navigate,
  onRouteChange,
  registerLazyScreen,
  registerScreen,
} from './core/router.js';
import { applyTheme, resolveTheme, switchTheme, watchSystemTheme } from './core/theme.js';
import { initModalFocus } from './core/modal-focus.js';
import { initMonitoring } from './core/monitoring.js';
import { getTelegramUser, initTelegram, setBackButton } from './core/telegram.js';
import { showToast } from './core/toast.js';
import { track } from './core/track.js';
import { store } from './data/store.js';
import { TERMS_VERSION } from './data/terms-version.js';
import { dataResetScreen } from './screens/data-reset.js';
import { futureScreen } from './screens/future.js';
import { helpScreen } from './screens/help.js';
import { introScreen } from './screens/intro.js';
import { notebookScreen } from './screens/notebook.js';
import { plannerScreen } from './screens/planner.js';
import { questScreen } from './screens/quest.js';
import { settingsAboutScreen } from './screens/settings-about.js';
import { settingsAccessScreen } from './screens/settings-access.js';
import { settingsDataScreen } from './screens/settings-data.js';
import { settingsDatesScreen } from './screens/settings-dates.js';
import { settingsThemeScreen } from './screens/settings-theme.js';
import { settingsScreen } from './screens/settings.js';
import { settingsHistoryScreen } from './screens/settings-history.js';

const START_SCREEN = { intro: 'intro', terms: 'terms', done: 'planner' };

const app = document.getElementById('app');

function refreshThemeControls() {
  const greeting = app.querySelector('.greeting');
  if (getCurrent().name === 'settings-theme') render();
  else if (greeting) greeting.outerHTML = renderGreeting();
}

const GLOBAL_ACTIONS = {
  toggleTheme() {
    const next = resolveTheme(store.getProfile().theme) === 'dark' ? 'light' : 'dark';
    store.setTheme(next);
    switchTheme(next, refreshThemeControls);
  },
};

const BARE_CHROME = new Set(['onboarding', 'fullscreen']);
let mountedScreen = null;

/** @returns {HTMLElement | null} */
const getOpenModal = () => app.querySelector('.modal');
const syncBackButton = () => setBackButton(canGoBack() || Boolean(getOpenModal()), handleBack);

function handleBack() {
  const modal = getOpenModal();
  if (modal) /** @type {HTMLButtonElement | null} */ (modal.querySelector('.modal__backdrop'))?.click();
  else back();
}

function render() {
  const { name, screen, params } = getCurrent();
  if (!screen) {
    loadScreen(name)
      .then(() => getCurrent().name === name && render())
      .catch(() => showToast('Не вдалося завантажити. Перевір з’єднання.'));
    return;
  }

  const isBare = BARE_CHROME.has(screen.chrome);

  mountedScreen?.unmount?.();
  app.className = `app app--${screen.chrome}`;
  app.innerHTML = `
    ${isBare ? '' : renderGreeting()}
    <main class="app__main">${screen.render(params)}</main>
    ${isBare ? '' : renderNavbar(params.tab ?? screen.tab)}`;

  mountedScreen = screen;
  screen.mount?.(app.querySelector('.app__main'), params);
  syncBackButton();
}

// No style attributes in markup (CSP): `data-progress` becomes the --progress variable before paint.
function syncProgress() {
  /** @type {NodeListOf<HTMLElement>} */ (app.querySelectorAll('[data-progress]')).forEach((element) => {
    element.style.setProperty('--progress', element.dataset.progress);
  });
}

new MutationObserver(() => {
  syncBackButton();
  syncProgress();
}).observe(app, { childList: true, subtree: true });
initModalFocus(app);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && getOpenModal()) handleBack();
});

app.addEventListener('click', (event) => {
  const target = /** @type {HTMLButtonElement | null} */ (
    /** @type {HTMLElement} */ (event.target).closest('[data-toast], [data-back], [data-nav], [data-action]')
  );
  if (!target || target.disabled) return;

  const { toast, nav, action } = target.dataset;
  if (toast) showToast(toast);
  else if ('back' in target.dataset) back();
  else if (nav) navigate(nav, {}, { reset: 'navReset' in target.dataset });
  else if (action) (getCurrent().screen?.actions?.[action] ?? GLOBAL_ACTIONS[action])?.(target, event);
});

initMonitoring(() => {
  const user = getTelegramUser();
  return [...store.getUserTexts(), user?.first_name, user?.last_name, user?.username].filter(Boolean);
});
initTelegram();
applyTheme(store.getProfile().theme);
watchSystemTheme(refreshThemeControls);

registerScreen('data-reset', dataResetScreen);
registerScreen('intro', introScreen);
registerLazyScreen('terms', () => import('./screens/terms.js').then((module) => module.termsScreen));
registerScreen('planner', plannerScreen);
registerScreen('notebook', notebookScreen);
registerScreen('quest', questScreen);
registerScreen('future', futureScreen);
registerScreen('help', helpScreen);
registerScreen('settings', settingsScreen);
registerScreen('settings-history', settingsHistoryScreen);
registerLazyScreen('settings-terms', () => import('./screens/terms.js').then((module) => module.termsReadScreen));
registerScreen('settings-theme', settingsThemeScreen);
registerScreen('settings-dates', settingsDatesScreen);
registerScreen('settings-access', settingsAccessScreen);
registerScreen('settings-data', settingsDataScreen);
registerScreen('settings-about', settingsAboutScreen);
registerLazyScreen('ai-demo', () => import('./screens/ai-demo.js').then((module) => module.aiDemoScreen));

onRouteChange(render);
const startScreen = store.isBroken()
  ? 'data-reset'
  : START_SCREEN[getOnboardingStep(store.getProfile(), TERMS_VERSION)];
navigate(startScreen, {}, { reset: true });
track('app_open', { screen: startScreen });

if (import.meta.env.DEV) {
  window.demo = { navigate, back, store };
}
