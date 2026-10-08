// @ts-check
import { addToHomeScreen, canAddToHomeScreen } from '../core/telegram.js';

export const settingsAccessScreen = {
  chrome: 'nested',
  tab: 'settings',

  render() {
    const homeScreen = canAddToHomeScreen()
      ? '<button class="button" type="button" data-action="addToHomeScreen">Додати на головний екран</button>'
      : '<p class="screen__text">Відкрий меню застосунку (⋯ угорі) і вибери «Додати на головний екран», якщо цей пункт є у твоїй версії Telegram.</p>';

    return `
      <section class="screen">
        <h1 class="screen__title">Швидкий вхід</h1>
        <ol class="howto">
          <li class="howto__step">
            <span class="howto__title">Кнопка «Відкрити»</span>
            У чаті з ботом вона відкриває планер одразу з полем для нової справи.
          </li>
          <li class="howto__step">
            <span class="howto__title">Закріпи чат</span>
            У списку чатів затисни чат із ботом і вибери «Закріпити».
          </li>
          <li class="howto__step">
            <span class="howto__title">Головний екран</span>
            Іконка застосунку поруч з іншими на телефоні.
          </li>
        </ol>
        ${homeScreen}
      </section>`;
  },

  actions: {
    addToHomeScreen,
  },
};
