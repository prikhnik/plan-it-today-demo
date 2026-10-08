/** Decorative note icons by note content (spec 6.1.5, 12.5.9). First match wins. */
const DECO_RULES = [
  ['pill', /аптек|лік(?!ар)|вітамін|таблет/u],
  ['cross', /лікар|лікарн|поліклінік|аналіз/u],
  ['phone', /подзвон|дзвін|телефон/u],
  ['bread', /хліб|батон|булк/u],
  ['pot', /вечер|обід|сніданок|приготу|рецепт/u],
  ['broom', /прибира|прибрат|помит|пилосос/u],
  ['laptop', /робоч|проєкт|проект|демо|звіт|специфікац/u],
  ['box', /посилк|пошт|доставк/u],
  ['basket', /купит|магазин|продукт/u],
];

export function getDecoIcon(title) {
  const text = title.toLowerCase();
  return DECO_RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
