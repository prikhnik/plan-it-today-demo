// @ts-check
import { haptic } from './telegram.js';

/** @param {HTMLElement} list @param {(ids: string[]) => void} save */
export function mountCardSort(list, save) {
  const selector = '[data-sort-group]';
  const buttons = () => /** @type {HTMLElement[]} */ ([...list.querySelectorAll(selector)]);
  let card = null;
  let origin = [];
  let active = false;
  let startX = 0;
  let startY = 0;
  let x = 0;
  let y = 0;
  let timer = 0;
  let frame = 0;
  let suppressClick = false;
  let touchGesture = false;
  let suppressTimer = 0;
  const scroller = list.closest('.app__main');

  const group = () => buttons().filter((item) => item.dataset.sortGroup === card?.dataset.sortGroup);
  const announce = (text) => {
    list.querySelector('[role="status"]').textContent = text;
  };

  function moveAtPoint() {
    const target = /** @type {HTMLElement | null} */ (document.elementFromPoint(x, y)?.closest(selector));
    if (!target || target === card || !list.contains(target) || target.dataset.sortGroup !== card.dataset.sortGroup)
      return;
    const items = group();
    const after = items.indexOf(target) > items.indexOf(card);
    const sourceItem = card.parentElement;
    const targetItem = target.parentElement;
    list.insertBefore(sourceItem, after ? targetItem.nextSibling : targetItem);
    const position = group().indexOf(card) + 1;
    announce(`Позиція ${position} з ${items.length}`);
  }

  function scroll() {
    if (!active) return;
    const bounds = scroller.getBoundingClientRect();
    const speed = y < bounds.top + 48 ? -8 : y > bounds.bottom - 48 ? 8 : 0;
    if (speed) {
      scroller.scrollTop += speed;
      moveAtPoint();
    }
    frame = requestAnimationFrame(scroll);
  }

  function activate() {
    if (!card) return;
    active = true;
    suppressClick = true;
    card.classList.add('sort-card--dragging');
    list.classList.add('sort-list--dragging');
    card.setAttribute('aria-pressed', 'true');
    announce('Перетягни справу на потрібне місце. Escape — скасувати.');
    haptic('light');
    frame = requestAnimationFrame(scroll);
  }

  function begin(target, point, touch) {
    if (card) return;
    card = target.closest(selector);
    if (!card || !list.contains(card)) {
      card = null;
      return;
    }
    touchGesture = touch;
    origin = [...list.children];
    startX = x = point.clientX;
    startY = y = point.clientY;
    if (touch) timer = window.setTimeout(activate, 350);
  }

  function move(point, touch) {
    if (!card) return;
    x = point.clientX;
    y = point.clientY;
    if (!active && Math.hypot(x - startX, y - startY) > 8) {
      if (touch) {
        finish(true);
        return;
      }
      activate();
    }
    if (active) moveAtPoint();
  }

  function finish(cancel = false) {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    if (!card) return;
    if (active) {
      const dropTarget = /** @type {HTMLElement | null} */ (document.elementFromPoint(x, y)?.closest(selector));
      cancel ||= !dropTarget || !list.contains(dropTarget) || dropTarget.dataset.sortGroup !== card.dataset.sortGroup;
      if (cancel) {
        for (const item of origin) list.append(item);
      } else save(group().map((item) => item.dataset.cardId));
      card.classList.remove('sort-card--dragging');
      card.removeAttribute('aria-pressed');
      list.classList.remove('sort-list--dragging');
      announce(cancel ? 'Порядок не змінено.' : 'Порядок збережено.');
      suppressTimer = window.setTimeout(
        () => {
          suppressClick = false;
        },
        touchGesture ? 500 : 0,
      );
    }
    card = null;
    active = false;
  }

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button === 0) begin(event.target, event, false);
  };
  const onPointerMove = (event) => {
    if (event.pointerType === 'mouse') move(event, false);
  };
  const onPointerUp = (event) => {
    if (event.pointerType === 'mouse') finish();
  };
  const onTouchStart = (event) => {
    if (event.touches.length === 1) begin(event.target, event.touches[0], true);
    else finish(true);
  };
  const onTouchMove = (event) => {
    if (active && event.cancelable) event.preventDefault();
    if (event.touches.length === 1) move(event.touches[0], true);
    else finish(true);
  };
  const onTouchEnd = () => finish();
  const onCancel = () => finish(true);
  const onPointerCancel = (event) => {
    if (event.pointerType === 'mouse') finish(true);
  };
  const onClick = (event) => {
    if (!suppressClick) return;
    if (event.detail > 0 && Math.hypot(event.clientX - x, event.clientY - y) < 8) {
      event.preventDefault();
      event.stopPropagation();
    }
    suppressClick = false;
    clearTimeout(suppressTimer);
  };
  const onContextMenu = (event) => {
    if (event.target.closest(selector)) event.preventDefault();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      finish(true);
      return;
    }
    if (!event.altKey || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const current = event.target.closest(selector);
    if (!current || !list.contains(current)) return;
    event.preventDefault();
    const items = buttons().filter((item) => item.dataset.sortGroup === current.dataset.sortGroup);
    const index = items.indexOf(current);
    const next = index + (['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1);
    if (!items[next]) return;
    list.insertBefore(
      current.parentElement,
      next > index ? items[next].parentElement.nextSibling : items[next].parentElement,
    );
    current.focus();
    save(
      buttons()
        .filter((item) => item.dataset.sortGroup === current.dataset.sortGroup)
        .map((item) => item.dataset.cardId),
    );
    announce(`Позиція ${next + 1} з ${items.length}. Порядок збережено.`);
  };

  list.addEventListener('pointerdown', onPointerDown);
  list.addEventListener('touchstart', onTouchStart, { passive: true });
  list.addEventListener('touchmove', onTouchMove, { passive: false });
  list.addEventListener('contextmenu', onContextMenu);
  list.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('touchend', onTouchEnd);
  document.addEventListener('touchcancel', onCancel);
  window.addEventListener('blur', onCancel);
  return () => {
    finish(true);
    clearTimeout(suppressTimer);
    list.removeEventListener('pointerdown', onPointerDown);
    list.removeEventListener('touchstart', onTouchStart);
    list.removeEventListener('touchmove', onTouchMove);
    list.removeEventListener('contextmenu', onContextMenu);
    list.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onCancel);
    window.removeEventListener('blur', onCancel);
  };
}
