const ROWS = [
  { label: 'Тема' },
  { label: 'Як писати дату' },
  { label: 'Демо ШІ-помічника' },
  { label: 'Умови користування', nav: 'settings-terms' },
  { label: 'Дані користувача' },
  { label: 'Про застосунок' },
];

export const settingsScreen = {
  chrome: 'tab',
  tab: 'settings',
  render() {
    const rows = ROWS.map(({ label, nav }) => `
      <li class="menu__item">
        <button class="menu__link" type="button" ${nav ? `data-nav="${nav}"` : 'data-toast="Скоро"'}>
          <span class="menu__label">${label}</span>
          <span class="menu__chevron" aria-hidden="true"></span>
        </button>
      </li>`).join('');

    return `
      <section class="screen">
        <h1 class="screen__title">Налаштування</h1>
        <ul class="menu">${rows}</ul>
      </section>`;
  },
};
