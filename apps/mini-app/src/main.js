import './styles/main.scss';
import { getOnboardingStep } from '@plan-it-today/shared-types';
import { renderGreeting } from './components/greeting.js';
import { renderNavbar } from './components/navbar.js';
import { back, canGoBack, getCurrent, navigate, onRouteChange, registerScreen } from './core/router.js';
import { initTelegram, setBackButton } from './core/telegram.js';
import { applyTheme, watchSystemTheme } from './core/theme.js';
import { showToast } from './core/toast.js';
import { MOCK_CARDS } from './data/mock.js';
import { store } from './data/store.js';
import { TERMS_VERSION } from './data/terms.js';
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
import { termsReadScreen, termsScreen } from './screens/terms.js';

const START_SCREEN = { intro: 'intro', terms: 'terms', done: 'planner' };

const app = document.getElementById('app');
const handleBack = () => back();

function render() {
  const { screen, params } = getCurrent();
  const isOnboarding = screen.chrome === 'onboarding';

  app.className = `app app--${screen.chrome}`;
  app.innerHTML = `
    ${isOnboarding ? '' : renderGreeting()}
    <main class="app__main">${screen.render(params)}</main>
    ${isOnboarding ? '' : renderNavbar(params.tab ?? screen.tab)}`;

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
  else if (action) getCurrent().screen.actions?.[action]?.(target, event);
});

initTelegram();
applyTheme(store.getProfile().theme);
watchSystemTheme();

registerScreen('intro', introScreen);
registerScreen('terms', termsScreen);
registerScreen('planner', plannerScreen);
registerScreen('notebook', notebookScreen);
registerScreen('quest', questScreen);
registerScreen('future', futureScreen);
registerScreen('help', helpScreen);
registerScreen('settings', settingsScreen);
registerScreen('settings-terms', termsReadScreen);
registerScreen('settings-theme', settingsThemeScreen);
registerScreen('settings-dates', settingsDatesScreen);
registerScreen('settings-access', settingsAccessScreen);
registerScreen('settings-data', settingsDataScreen);
registerScreen('settings-about', settingsAboutScreen);

onRouteChange(render);
navigate(START_SCREEN[getOnboardingStep(store.getProfile(), TERMS_VERSION)], { focus: true }, { reset: true });

if (import.meta.env.DEV) {
  window.demo = { navigate, back, store, mock: MOCK_CARDS };
}
