// @ts-check
const ROWS = [
  { label: 'Тема', nav: 'settings-theme' },
  { label: 'Як писати дату', nav: 'settings-dates' },
  { label: 'Швидкий вхід', nav: 'settings-access' },
  { label: 'Демо ШІ-помічника', nav: 'ai-demo' },
  { label: 'Умови користування', nav: 'settings-terms' },
  { label: 'Дані користувача', nav: 'settings-data' },
  { label: 'Про застосунок', nav: 'settings-about' },
];

export const settingsScreen = {
  chrome: 'tab',
  tab: 'settings',
  render() {
    const rows = ROWS.map(
      ({ label, nav, toast }) => `
      <li class="menu__item">
        <button class="menu__link" type="button" ${nav ? `data-nav="${nav}"` : `data-toast="${toast}"`}>
          <span class="menu__label">${label}</span>
          <span class="menu__chevron" aria-hidden="true"></span>
        </button>
      </li>`,
    ).join('');

    return `
      <section class="screen">
        <h1 class="screen__title">Налаштування</h1>
        <ul class="menu">${rows}</ul>
      </section>`;
  },
};
