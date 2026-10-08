/** @typedef {import('./types.js').Step} Step */
/** @typedef {import('./types.js').Progress} Progress */

const byOrder = (a, b) => a.order - b.order;

/**
 * @param {Step[]} steps
 * @param {string} cardId
 * @returns {Step[]}
 */
export function getTopLevelSteps(steps, cardId) {
  return steps.filter((step) => step.cardId === cardId && !step.parentId).sort(byOrder);
}

/**
 * @param {Step[]} steps
 * @param {string} parentId
 * @returns {Step[]}
 */
export function getChildSteps(steps, parentId) {
  return steps.filter((step) => step.parentId === parentId).sort(byOrder);
}

/**
 * A step with children is done only when all its children are done.
 * @param {Step} step
 * @param {Step[]} steps
 */
export function isStepDone(step, steps) {
  const children = getChildSteps(steps, step.id);
  return children.length > 0 ? children.every((child) => child.done) : step.done;
}

/**
 * @param {Step} step
 * @param {Step[]} steps
 * @returns {Progress}
 */
export function getStepProgress(step, steps) {
  const children = getChildSteps(steps, step.id);
  return { done: children.filter((child) => child.done).length, total: children.length };
}

/**
 * Counts top-level steps only.
 * @param {string} cardId
 * @param {Step[]} steps
 * @returns {Progress}
 */
export function getCardProgress(cardId, steps) {
  const topLevel = getTopLevelSteps(steps, cardId);
  return { done: topLevel.filter((step) => isStepDone(step, steps)).length, total: topLevel.length };
}

/** @param {Progress} progress */
export const isQuest = (progress) => progress.total > 0;

/** @param {Progress} progress */
export const canFinishQuest = (progress) => progress.total > 0 && progress.done === progress.total;

/** @param {Progress} progress */
export const canMarkNoteDone = (progress) => progress.total === 0;
