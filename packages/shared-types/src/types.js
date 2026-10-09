// @ts-check
/**
 * @typedef {'active' | 'done'} CardStatus
 * @typedef {'manual' | 'ai'} CardSource
 * @typedef {'system' | 'light' | 'dark'} ThemePreference
 */

/**
 * Card without steps is a plain note; with steps it is a quest.
 * @typedef {object} Card
 * @property {string} id
 * @property {string} title Full note text.
 * @property {string} date Plan day, ISO `YYYY-MM-DD`.
 * @property {CardStatus} status
 * @property {CardSource} source
 * @property {string | null} completedAt ISO date the card was finished, null while active.
 * @property {string} createdAt ISO timestamp.
 * @property {number} [order] Manual position within a day and priority group; lower first.
 * @property {boolean} [priority] Marked important: shown first while active; missing in old records means false.
 */

/**
 * @typedef {object} Step
 * @property {string} id
 * @property {string} cardId
 * @property {string | null} parentId Only one nesting level.
 * @property {string} text
 * @property {boolean} done
 * @property {number} order
 */

/**
 * @typedef {object} UserProfile
 * @property {boolean} introSeen
 * @property {string | null} termsAcceptedVersion
 * @property {string | null} termsAcceptedAt ISO timestamp.
 * @property {ThemePreference} theme
 */

/**
 * @typedef {object} Progress
 * @property {number} done
 * @property {number} total
 */

export {};
