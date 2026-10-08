// @ts-check
import { readJson, writeJson } from '../core/storage.js';

const LAST_KEY = 'phrase';

export const GREETING_PHRASES = [
  'Одна справа за раз.',
  'Це менше, ніж здається.',
  'Розпиши — і стане легше.',
  'Крок за кроком, без поспіху.',
  'Усе не обов’язково сьогодні.',
  'Почни з найменшого кроку.',
  'Решта почекає до завтра.',
  'Не так уже й багато справ.',
  'Спокійно. Усе під контролем.',
  'Складемо план — і видихнемо.',
  'Достатньо зробити головне.',
  'Сьогодні вистачить кількох справ.',
  'Маленькі кроки теж рахуються.',
  'Виписати — і вже легше.',
  'Без метушні, по порядку.',
  'Не треба тримати все в голові.',
  'Твій день — твій темп.',
  // Non-breaking spaces: on narrow screens it wraps after the dash.
  'Зробиш, скільки зробиш,\u00A0— і\u00A0це\u00A0добре.',
  'Сьогодні — лише сьогодні.',
  'Головне — почати з першого кроку.',
];

/**
 * Random index in [0, count), never `last` when there is a choice.
 * @param {number} count
 * @param {unknown} last Index shown on the previous launch, if any.
 * @param {() => number} [random]
 */
export function pickPhraseIndex(count, last, random = Math.random) {
  const choices = Array.from({ length: count }, (_, index) => index).filter((index) => index !== last);
  const pool = choices.length ? choices : [0];
  return pool[Math.floor(random() * pool.length)];
}

let launchPhrase = null;

/** One phrase per launch: chosen on first call, kept while the app is open. */
export function getLaunchPhrase() {
  if (launchPhrase === null) {
    const index = pickPhraseIndex(GREETING_PHRASES.length, readJson(LAST_KEY, null));
    writeJson(LAST_KEY, index);
    launchPhrase = GREETING_PHRASES[index];
  }
  return launchPhrase;
}
