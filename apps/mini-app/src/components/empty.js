// @ts-check
export const renderEmpty = (modifier, text) => `
  <div class="empty">
    <div class="empty__illustration empty__illustration--${modifier}" aria-hidden="true"></div>
    <p class="empty__text">${text}</p>
  </div>`;
