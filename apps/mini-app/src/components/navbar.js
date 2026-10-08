const TABS = [
  { name: 'planner', label: 'Сьогодні' },
  { name: 'future', label: 'Майбутнє' },
  { name: 'help', label: 'Допомога' },
  { name: 'settings', label: 'Налаштування' },
];

export function renderNavbar(activeTab) {
  const items = TABS.map(({ name, label }) => {
    const isActive = name === activeTab;
    return `
      <button class="navbar__item${isActive ? ' navbar__item--active' : ''}" type="button"
        data-nav="${name}" data-nav-reset${isActive ? ' aria-current="page"' : ''}>
        <span class="navbar__icon navbar__icon--${name}" aria-hidden="true"></span>
        <span class="navbar__label">${label}</span>
      </button>`;
  }).join('');

  return `<nav class="navbar" aria-label="Розділи">${items}</nav>`;
}
