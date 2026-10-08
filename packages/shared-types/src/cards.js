/** @typedef {import('./types.js').Card} Card */

const byNewest = (a, b) => b.createdAt.localeCompare(a.createdAt);

/**
 * Planner shows today only: active cards up to today (past ones roll over silently)
 * and cards completed today.
 * @param {Card} card
 * @param {string} today ISO date.
 */
export function isOnPlanner(card, today) {
  return card.status === 'active' ? card.date <= today : card.completedAt === today;
}

/**
 * Active cards first (newest on top), completed today at the bottom.
 * @param {Card[]} cards
 * @param {string} today ISO date.
 */
export function getPlannerCards(cards, today) {
  const visible = cards.filter((card) => isOnPlanner(card, today));
  return [
    ...visible.filter((card) => card.status === 'active').sort(byNewest),
    ...visible.filter((card) => card.status === 'done').sort(byNewest),
  ];
}
