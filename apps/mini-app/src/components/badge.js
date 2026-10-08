/** @param {import('@plan-it-today/shared-types/src/types.js').Progress} progress */
export function renderBadge({ done, total }) {
  const state = done === 0 ? 'empty' : done === total ? 'full' : 'half';
  return `
    <span class="badge badge--${state}">
      <span class="badge__icon" aria-hidden="true"></span>
      <span class="badge__text">${done}/${total}</span>
    </span>`;
}
