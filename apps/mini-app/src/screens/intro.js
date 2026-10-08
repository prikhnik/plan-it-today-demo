// @ts-check
import { navigate } from '../core/router.js';
import { store } from '../data/store.js';

const POINTS = [
  { icon: 'write', title: 'Запиши справу', text: 'як у звичайному записнику' },
  { icon: 'split', title: 'Розбий на кроки', text: 'по 3-5 слів, без води' },
  { icon: 'check', title: 'Відмічай і видихай', text: 'бачиш прогрес, а не гору справ' },
];

export const introScreen = {
  chrome: 'onboarding',

  render() {
    const points = POINTS.map(
      ({ icon, title, text }) => `
      <li class="onboarding__point">
        <span class="onboarding__point-icon onboarding__point-icon--${icon}" aria-hidden="true"></span>
        <span class="onboarding__point-text">
          <span class="onboarding__point-title">${title}</span>
          ${text}
        </span>
      </li>`,
    ).join('');

    return `
      <section class="onboarding">
        <div class="onboarding__body">
          <div class="onboarding__illustration" aria-hidden="true"></div>
          <h1 class="onboarding__title">Plan It Today</h1>
          <p class="onboarding__subtitle">Одна справа за раз</p>
          <p class="onboarding__text">Запиши що завгодно одним рядком. Застосунок допоможе розбити це на прості кроки, щоб день не навалювався, а складався з маленьких перемог.</p>
          <ul class="onboarding__points">${points}</ul>
          <p class="onboarding__goal">Наша мета: щоб тобі було легше почати.</p>
        </div>
        <footer class="onboarding__footer">
          <button class="button button--primary" type="button" data-action="continue">Продовжити</button>
        </footer>
      </section>`;
  },

  actions: {
    continue() {
      store.markIntroSeen();
      navigate('terms');
    },
  },
};
