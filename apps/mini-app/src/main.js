import './styles/main.scss';
import { getOnboardingStep } from '@plan-it-today/shared-types';
import { renderNavbar } from './components/navbar.js';
import { renderTopbar } from './components/topbar.js';
import { back, canGoBack, getCurrent, navigate, onRouteChange, registerScreen } from './core/router.js';
import { closeApp, initTelegram, isTelegram, setBackButton } from './core/telegram.js';
import { applyTheme, watchSystemTheme } from './core/theme.js';
import { showToast } from './core/toast.js';
import { store } from './data/store.js';
import { TERMS_VERSION } from './data/terms.js';
import { futureScreen } from './screens/future.js';
import { helpScreen } from './screens/help.js';
import { introScreen } from './screens/intro.js';
import { plannerScreen } from './screens/planner.js';
import { settingsScreen } from './screens/settings.js';
import { termsReadScreen, termsScreen } from './screens/terms.js';

const START_SCREEN = { intro: 'intro', terms: 'terms', done: 'planner' };

const GLOBAL_ACTIONS = {
  close: () => (isTelegram ? closeApp() : showToast('Закрити можна в Telegram')),
};

const app = document.getElementById('app');
const handleBack = () => back();

function getTopbarLeft(chrome) {
  if (canGoBack() && !isTelegram) return 'back';
  return chrome === 'onboarding' ? null : 'close';
}

function render() {
  const { screen, params } = getCurrent();
  const isOnboarding = screen.chrome === 'onboarding';
  const left = getTopbarLeft(screen.chrome);

  app.className = `app app--${screen.chrome}`;
  app.innerHTML = `
    ${isOnboarding && !left ? '' : renderTopbar({ left, title: !isOnboarding })}
    <main class="app__main">${screen.render(params)}</main>
    ${isOnboarding ? '' : renderNavbar(screen.tab)}`;

  screen.mount?.(app.querySelector('.app__main'), params);
  setBackButton(canGoBack(), handleBack);
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-toast], [data-back], [data-nav], [data-action]');
  if (!target || target.disabled) return;

  const { toast, nav, action } = target.dataset;
  if (toast) showToast(toast);
  else if ('back' in target.dataset) back();
  else if (nav) navigate(nav, {}, { reset: 'navReset' in target.dataset });
  else if (action) (getCurrent().screen.actions?.[action] ?? GLOBAL_ACTIONS[action])?.(target, event);
});

initTelegram();
applyTheme(store.getProfile().theme);
watchSystemTheme();

registerScreen('intro', introScreen);
registerScreen('terms', termsScreen);
registerScreen('planner', plannerScreen);
registerScreen('future', futureScreen);
registerScreen('help', helpScreen);
registerScreen('settings', settingsScreen);
registerScreen('settings-terms', termsReadScreen);

onRouteChange(render);
navigate(START_SCREEN[getOnboardingStep(store.getProfile(), TERMS_VERSION)], {}, { reset: true });

if (import.meta.env.DEV) {
  window.demo = { navigate, store };
}
