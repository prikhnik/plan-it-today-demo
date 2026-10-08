// @ts-check
/**
 * Product events without user text: app_open, card_created, quest_completed, theme_changed.
 * No analytics provider yet (Q55): events go nowhere, in dev they are logged.
 * @param {string} event
 * @param {Record<string, string | number | boolean>} [props]
 */
export function track(event, props = {}) {
  if (import.meta.env.DEV) console.debug('[track]', event, props);
}
