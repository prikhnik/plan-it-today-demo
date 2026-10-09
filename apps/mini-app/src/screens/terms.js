// @ts-check
import { navigate } from '../core/router.js';
import { store } from '../data/store.js';
import { TERMS, TERMS_VERSION } from '../data/terms.js';

function renderTerms(footer) {
  const sections = TERMS.sections
    .map(
      ({ title, text }) => `
    <section class="terms__section">
      <h2 class="terms__title">${title}</h2>
      <p class="terms__text">${text}</p>
    </section>`,
    )
    .join('');

  return `
    <section class="onboarding onboarding--terms">
      <div class="onboarding__body">
        <h1 class="onboarding__heading">${TERMS.title}</h1>
        <p class="onboarding__text">${TERMS.lead}</p>
        <div class="terms" tabindex="0">${sections}</div>
      </div>
      <footer class="onboarding__footer">${footer}</footer>
    </section>`;
}

export const termsScreen = {
  chrome: 'onboarding',

  render: () =>
    renderTerms(`
    <button class="button button--primary" type="button" data-action="accept">Прийняти</button>
    <p class="onboarding__note">${TERMS.consent}</p>`),

  actions: {
    accept() {
      store.acceptTerms(TERMS_VERSION);
      navigate('planner', {}, { reset: true });
    },
  },
};

export const termsReadScreen = {
  chrome: 'nested',
  tab: 'settings',
  render: () => renderTerms('<button class="button" type="button" data-back>Назад</button>'),
};
