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
let stack = [];
const listeners = new Set();

export function registerScreen(name, screen) {
  screens.set(name, screen);
}

export function navigate(name, params = {}, { reset = false, replace = false } = {}) {
  if (!screens.has(name)) throw new Error(`Unknown screen: ${name}`);
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

export function getCurrent() {
  const entry = stack.at(-1);
  return entry ? { ...entry, screen: screens.get(entry.name) } : null;
}

export function onRouteChange(listener) {
  listeners.add(listener);
}
