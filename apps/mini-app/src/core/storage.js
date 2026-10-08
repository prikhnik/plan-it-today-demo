// @ts-check
const PREFIX = 'pit:';

export const BROKEN = Symbol('broken');

/**
 * @param {string} key
 * @returns {unknown} null when missing or storage is unavailable, BROKEN when the JSON does not parse.
 */
export function readStored(key) {
  let raw;
  try {
    raw = localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return BROKEN;
  }
}

export function readJson(key, fallback) {
  const value = readStored(key);
  return value === null || value === BROKEN ? fallback : value;
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage unavailable: nothing to clear.
  }
}
