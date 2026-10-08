# Plan It Today

Telegram Mini App: справа превращается в квест из простых шагов, план только на сегодня. Сейчас демо на моках, данные в `localStorage`.

Демо: https://plan-it-today-demo.vercel.app/ (бот `@plan_it_today_demo_bot`).

## Команды

Через `corepack pnpm` из корня:

1. `install`, `dev`, `build`, `preview`.
2. `test`: юнит-тесты (`packages/shared-types`, `apps/mini-app/test`).
3. `test:e2e`: Playwright + axe (`apps/mini-app/e2e`), сам собирает и поднимает `vite preview`. Браузер один раз: `corepack pnpm --filter mini-app exec playwright install chromium`.
4. `lint`, `format:check`, `typecheck`.
5. `assets`: WebP из `docs/design/assets` (Python + Pillow).
6. `--filter mini-app measure`: замеры скорости первого экрана и смены темы.

## Документы

1. `CLAUDE.md`: контекст проекта, решения, прогресс.
2. `docs/spec/plan-it-today.md`: спецификация.
3. `docs/deploy.md`: деплой, переменные, CSP.
4. `reports/`: отчёты по этапам.
