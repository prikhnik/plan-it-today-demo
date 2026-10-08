// @ts-check
import { getCurrent, navigate } from '../core/router.js';
import { openLink } from '../core/telegram.js';
import { showToast } from '../core/toast.js';

const SUPPORT_URL = '';

const refreshIfVisible = () => getCurrent()?.name === 'help' && navigate('help', {}, { replace: true });
window.addEventListener('online', refreshIfVisible);
window.addEventListener('offline', refreshIfVisible);

export const helpScreen = {
  chrome: 'tab',
  tab: 'help',

  render() {
    const isOnline = navigator.onLine;
    return `
      <section class="screen screen--centered">
        <div class="screen__illustration screen__illustration--help" aria-hidden="true"></div>
        <h1 class="screen__title">Якщо важко</h1>
        <p class="screen__text">Ти не мусиш справлятися сам. Звернися до фахівця або на гарячу лінію.</p>
        <button class="button button--primary" type="button" data-action="openSupport"${isOnline ? '' : ' disabled'}>
          Сайт підтримки
          <span class="button__icon button__icon--external" aria-hidden="true"></span>
        </button>
        ${isOnline ? '' : '<p class="screen__text">Немає з’єднання. Відкрий пізніше.</p>'}
        <p class="screen__note">Застосунок не замінює лікаря.</p>
      </section>`;
  },

  actions: {
    openSupport: () => (SUPPORT_URL ? openLink(SUPPORT_URL) : showToast('Посилання на сайт з’явиться згодом')),
  },
};
