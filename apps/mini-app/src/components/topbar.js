const sideButton = (kind) =>
  kind === 'back'
    ? '<button class="topbar__side" type="button" data-back>Назад</button>'
    : '<button class="topbar__side" type="button" data-action="close">Закрити</button>';

/**
 * @param {{ left: 'close' | 'back' | null, title?: boolean }} options
 */
export function renderTopbar({ left, title = true }) {
  return `
    <header class="topbar">
      ${left ? sideButton(left) : '<span class="topbar__side"></span>'}
      <span class="topbar__title">${title ? 'Plan It Today' : ''}</span>
      <span class="topbar__side" aria-hidden="true"></span>
    </header>`;
}
