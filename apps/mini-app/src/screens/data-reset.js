// @ts-check
import { navigate } from '../core/router.js';
import { applyTheme } from '../core/theme.js';
import { store } from '../data/store.js';

export const dataResetScreen = {
  chrome: 'fullscreen',

  render: () => `
    <section class="screen">
      <h1 class="screen__title">Дані пошкоджені</h1>
      <p class="screen__text">Не вдалося прочитати збережені справи на цьому пристрої. Скинь дані, і застосунок почне спочатку.</p>
      <button class="button button--primary" type="button" data-action="reset">Скинути дані</button>
    </section>`,

  actions: {
    reset() {
      store.deleteAllData();
      applyTheme('system');
      navigate('intro', {}, { reset: true });
    },
  },
};
