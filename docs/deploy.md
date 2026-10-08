# Деплой

Решение Q33: демо на Vercel + GitHub, коммерческая версия фронта на Cloudflare Pages + GitHub, бэкенд и бот в Docker (хостинг выбираем на этапе бэкенда).

## Демо: Vercel

1. `git init`, первый коммит, репозиторий на GitHub.
2. Vercel → Add New Project → импорт репозитория.
3. Root Directory: `apps/mini-app`. Framework: Vite (подхватится из `apps/mini-app/vercel.json`). Остальное по умолчанию: pnpm-воркспейс Vercel находит по `pnpm-lock.yaml` в корне.
4. Deploy. Каждый push в `main` обновляет основную ссылку, ветки получают превью.
5. Превью-ссылки по умолчанию закрыты авторизацией Vercel (Settings → Deployment Protection) и в Telegram не откроются. Тестерам давать основную ссылку или отключить защиту для превью.

### Переменные окружения

1. `VITE_SENTRY_DSN` (Settings → Environment Variables): DSN проекта Sentry. Без неё отчёты об ошибках выключены и SDK не попадает в сборку (Q55). После добавления нужен новый деплой.
2. Метку сборки в «Про застосунок» Vercel даёт сам (`VERCEL_GIT_COMMIT_SHA`), настраивать ничего не нужно.
3. Шаблон: `apps/mini-app/.env.example`.

### Заголовки и CSP

1. `apps/mini-app/vercel.json` задаёт для всех страниц `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, для `/assets/*` вечный кэш.
2. CSP разрешает скрипты только с самого сайта и `https://telegram.org` (SDK), запросы только к сайту и `*.sentry.io`, без inline-стилей (`style="…"` в разметке не работает).
3. Inline-скрипт выбора темы в `index.html` разрешён по sha256-хешу. Если скрипт поменяли, `pnpm build` падает и печатает новый хеш: вставить его в `script-src` в `vercel.json`.
4. `vite preview` и E2E-тесты отдают те же заголовки (читают `vercel.json`), поэтому ошибка CSP видна до деплоя.

## Telegram

1. BotFather → `/mybots` → бот → Bot Settings → Menu Button → URL основной ссылки Vercel.
2. Прямая ссылка: BotFather → `/newapp` (Mini App с коротким именем) → `t.me/<bot>/<app>`; вход всегда на Планер (Q45).
3. Telegram держит свёрнутое мини-приложение в памяти: после деплоя закрыть его полностью и открыть заново. Версию проверить в «Налаштування → Про застосунок» (хеш коммита в «збірка …»).

## Коммерческая версия: Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → подключить тот же репозиторий.
2. Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm build`. Output directory: `apps/mini-app/dist`. Root directory: корень репозитория.
3. Заголовки: файл `apps/mini-app/public/_headers` (добавить при переезде): те же CSP, `nosniff`, `Referrer-Policy` и кэш `/assets/*`, что в `vercel.json`. Плагин сборки проверяет хеш только в `vercel.json`: при переезде перенести проверку на `_headers`.
4. Метка сборки: Cloudflare даёт `CF_PAGES_COMMIT_SHA`; добавить её в `getBuildLabel()` в `vite.config.js`.

## Проверка перед раздачей ссылки

1. Локально зелёные: `corepack pnpm lint`, `format:check`, `typecheck`, `test`, `build`, `test:e2e`. Для E2E один раз поставить браузер: `corepack pnpm --filter mini-app exec playwright install chromium`.
2. После деплоя в «Про застосунок» стоит хеш нового коммита.
3. Ссылка открывается в Telegram на iOS, Android, Desktop и Web, обе темы, без ошибок CSP (в Telegram Web: F12 → Console, строки «Refused to…»).
