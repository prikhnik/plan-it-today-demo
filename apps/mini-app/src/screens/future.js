import { renderEmpty } from '../components/empty.js';

export const futureScreen = {
  chrome: 'tab',
  tab: 'future',
  render: () => `
    <section class="screen">
      <h1 class="screen__title">Майбутнє</h1>
      ${renderEmpty('future', 'На цей день справ немає')}
    </section>`,
};
