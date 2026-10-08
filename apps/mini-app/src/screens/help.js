export const helpScreen = {
  chrome: 'tab',
  tab: 'help',
  render: () => `
    <section class="screen screen--centered">
      <div class="screen__illustration screen__illustration--help" aria-hidden="true"></div>
      <h1 class="screen__title">Якщо важко</h1>
      <p class="screen__text">Ти не мусиш справлятися сам. Зверніся до фахівця або на гарячу лінію.</p>
      <button class="button button--primary" type="button" data-toast="Скоро">Сайт підтримки</button>
      <p class="screen__note">Застосунок не замінює лікаря.</p>
    </section>`,
};
