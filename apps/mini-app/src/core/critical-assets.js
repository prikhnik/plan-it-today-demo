// @ts-check
// Paths inside src/assets. The build injects their URLs into index.html as #critical-assets.

const THEME_IMAGES = [
  'input-field',
  'icon-pencil',
  'btn-plus-round',
  'underline-mint',
  'note-taped',
  'note-taped-right',
  'note-curled',
  'badge-empty',
  'badge-half',
  'badge-full',
  'nav-board-active',
  'nav-planner',
  'nav-help',
  'nav-settings',
];

// Not preloaded on start, but loaded before a theme switch so nothing on the planner pops in.
const THEME_EXTRA = [
  ...['pill', 'cross', 'phone', 'bread', 'pot', 'broom', 'laptop', 'box', 'basket'].map((name) => `deco-${name}`),
  'row-frame',
];

// CSS masks are fetched in CORS mode, so they are preloaded separately.
const THEME_MASKS = ['note-taped-fill', 'note-taped-right-fill', 'note-curled-fill'];

const TEXTURES = {
  light: ['paper-light', 'overlay-creases'],
  dark: ['paper-dark'],
};

export const FONTS = ['fonts/neucha-cyrillic.woff2', 'fonts/neucha-latin.woff2'];

/** @param {'light' | 'dark'} theme */
export function getCriticalImages(theme) {
  return [
    ...TEXTURES[theme].map((name) => `textures/${name}.webp`),
    ...THEME_IMAGES.map((name) => `${theme}/${name}.webp`),
  ];
}

/** @param {'light' | 'dark'} theme */
export const getExtraImages = (theme) => THEME_EXTRA.map((name) => `${theme}/${name}.webp`);

/** @param {'light' | 'dark'} theme */
export const getMaskImages = (theme) => THEME_MASKS.map((name) => `${theme}/${name}.webp`);
