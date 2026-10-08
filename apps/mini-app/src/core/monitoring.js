// @ts-check
const REDACTED = '[текст]';
const MIN_TEXT_LENGTH = 2;

/**
 * Replaces every known user text (card titles, steps, name) inside a Sentry event.
 * @template T
 * @param {T} event
 * @param {string[]} texts
 * @returns {T}
 */
export function scrubEvent(event, texts) {
  const secrets = [...new Set(texts.map((text) => text.trim()).filter((text) => text.length >= MIN_TEXT_LENGTH))]
    .sort((a, b) => b.length - a.length)
    .map((text) => JSON.stringify(text).slice(1, -1));
  let json = JSON.stringify(event);
  secrets.forEach((secret) => {
    json = json.split(secret).join(REDACTED);
  });
  const scrubbed = JSON.parse(json);
  if (Array.isArray(scrubbed.breadcrumbs)) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.filter((crumb) => crumb.category !== 'console');
  }
  return scrubbed;
}

/**
 * Sentry starts only with VITE_SENTRY_DSN; without it the SDK is never downloaded.
 * @param {() => string[]} getUserTexts
 */
export function initMonitoring(getUserTexts) {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  import('@sentry/browser').then(({ init }) => {
    init({
      dsn,
      release: `plan-it-today@${__APP_VERSION__}`,
      environment: import.meta.env.MODE,
      beforeSend: (event) => scrubEvent(event, getUserTexts()),
    });
  });
}
