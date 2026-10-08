// @ts-check
/**
 * @typedef {object} Screen
 * @property {(params: object) => string} render
 * @property {(root: HTMLElement, params: object) => void} [mount]
 * @property {Record<string, (el: HTMLElement, event: Event) => void>} [actions]
 * @property {() => void} [unmount] Called before the screen is replaced.
 * @property {'tab' | 'nested' | 'onboarding' | 'fullscreen'} chrome
 * @property {string} [tab] Active bottom tab.
 */

/** @type {Map<string, Screen>} */
const screens = new Map();
/** @type {Map<string, () => Promise<Screen>>} */
const loaders = new Map();
let stack = [];
const listeners = new Set();

export function registerScreen(name, screen) {
  screens.set(name, screen);
}

/** Rare screens: their code is fetched on the first visit. */
export function registerLazyScreen(name, load) {
  loaders.set(name, load);
}

/** @returns {Promise<Screen>} */
export async function loadScreen(name) {
  if (!screens.has(name)) screens.set(name, await loaders.get(name)());
  return screens.get(name);
}

export function navigate(name, params = {}, { reset = false, replace = false } = {}) {
  if (!screens.has(name) && !loaders.has(name)) throw new Error(`Unknown screen: ${name}`);
  const entry = { name, params };
  if (reset) stack = [entry];
  else if (replace && stack.length) stack[stack.length - 1] = entry;
  else stack.push(entry);
  listeners.forEach((listener) => listener());
}

export function back() {
  if (stack.length < 2) return false;
  stack.pop();
  listeners.forEach((listener) => listener());
  return true;
}

export const canGoBack = () => stack.length > 1;

/** `screen` is undefined while a lazy screen is still loading. */
export function getCurrent() {
  const entry = stack.at(-1);
  return entry ? { ...entry, screen: screens.get(entry.name) } : null;
}

export function onRouteChange(listener) {
  listeners.add(listener);
}
