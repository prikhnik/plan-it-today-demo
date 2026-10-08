import { renderEmpty } from '../components/empty.js';

export const plannerScreen = {
  chrome: 'tab',
  tab: 'planner',
  render: () => `
    <section class="screen">
      <h1 class="screen__title">План на сьогодні</h1>
      ${renderEmpty('planner', 'Тут буде твоя перша справа')}
    </section>`,
};
