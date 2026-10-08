// @ts-check
const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), textarea:not([disabled])';
const SAME_TARGET_ATTRS = ['data-action', 'data-nav', 'data-card-id', 'data-step-id', 'data-date'];

/** @type {HTMLElement | null} */
let trigger = null;
/** @type {HTMLElement | null} */
let openPanel = null;

/** @param {HTMLElement} panel */
const getFocusable = (panel) => /** @type {HTMLElement[]} */ ([...panel.querySelectorAll(FOCUSABLE)]);

/**
 * Screens re-render after a modal action, so the button that opened it may be gone: find its twin.
 * @param {HTMLElement} root
 * @param {HTMLElement} element
 */
function findTrigger(root, element) {
  if (element.isConnected) return element;
  const selector = SAME_TARGET_ATTRS.filter((name) => element.hasAttribute(name))
    .map((name) => `[${name}="${CSS.escape(element.getAttribute(name))}"]`)
    .join('');
  return selector ? /** @type {HTMLElement | null} */ (root.querySelector(selector)) : null;
}

/** @param {HTMLElement} root */
function syncModal(root) {
  const panel = /** @type {HTMLElement | null} */ (root.querySelector('.modal__panel'));
  if (panel && panel !== openPanel) {
    openPanel = panel;
    if (!panel.contains(document.activeElement)) getFocusable(panel)[0]?.focus();
  } else if (!panel && openPanel) {
    openPanel = null;
    if (trigger) findTrigger(root, trigger)?.focus();
    trigger = null;
  }
}

/** @param {KeyboardEvent} event */
function trapTab(event) {
  if (event.key !== 'Tab' || !openPanel) return;
  const focusable = getFocusable(openPanel);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const inside = openPanel.contains(document.activeElement);
  if (!inside || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Modals inside `root`: focus moves in on open, Tab stays inside, focus returns to the opener on close.
 * @param {HTMLElement} root
 */
export function initModalFocus(root) {
  root.addEventListener(
    'click',
    (event) => {
      if (openPanel) return;
      trigger = /** @type {HTMLElement} */ (event.target).closest('button, input, textarea');
    },
    true,
  );
  new MutationObserver(() => syncModal(root)).observe(root, { childList: true, subtree: true });
  document.addEventListener('keydown', trapTab);
}
