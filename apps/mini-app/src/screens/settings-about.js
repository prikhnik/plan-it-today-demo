export const settingsAboutScreen = {
  chrome: 'nested',
  tab: 'settings',

  render: () => `
    <section class="screen">
      <h1 class="screen__title">Про застосунок</h1>
      <p class="screen__text">Plan It Today допомагає розбити справу на прості кроки й планувати лише сьогодні.</p>
      <p class="screen__text">Версія ${__APP_VERSION__}, демо. Дані зберігаються лише на цьому пристрої, ШІ-помічник ще не підключений.</p>
      <p class="screen__note">Шрифт Caveat, ліцензія SIL Open Font License 1.1.</p>
      <button class="button" type="button" data-nav="settings-terms">Умови користування</button>
    </section>`,
};
