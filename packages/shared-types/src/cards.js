// @ts-check
/** @typedef {import('./types.js').Card} Card */

const byNewest = (a, b) => b.createdAt.localeCompare(a.createdAt);
const byPriorityThenNewest = (a, b) => Number(Boolean(b.priority)) - Number(Boolean(a.priority)) || byNewest(a, b);

/**
 * «Важливо» is highlighted only while the card is active.
 * @param {Card} card
 */
export function isPriorityShown(card) {
  return card.status === 'active' && Boolean(card.priority);
}

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
 * Active cards first (priority on top, then newest), completed today at the bottom.
 * @param {Card[]} cards
 * @param {string} today ISO date.
 */
export function getPlannerCards(cards, today) {
  const visible = cards.filter((card) => isOnPlanner(card, today));
  return [
    ...visible.filter((card) => card.status === 'active').sort(byPriorityThenNewest),
    ...visible.filter((card) => card.status === 'done').sort(byNewest),
  ];
}

/**
 * A finished card goes back to work when its steps no longer allow finishing
 * (a step was unchecked or a new one added).
 * @param {Card} card
 * @param {import('./types.js').Progress} progress
 */
export function shouldReopen(card, progress) {
  return card.status === 'done' && progress.total > 0 && progress.done < progress.total;
}

/**
 * Active cards planned for a given future day: priority first, then newest.
 * @param {Card[]} cards
 * @param {string} day ISO date.
 */
export function getDayCards(cards, day) {
  return cards.filter((card) => card.status === 'active' && card.date === day).sort(byPriorityThenNewest);
}
