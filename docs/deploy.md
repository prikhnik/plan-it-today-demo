# Деплой

Решение Q33: демо на Vercel + GitHub, коммерческая версия фронта на Cloudflare Pages + GitHub, бэкенд и бот в Docker (хостинг выбираем на этапе бэкенда).

## Демо: Vercel

1. `git init`, первый коммит, репозиторий на GitHub.
2. Vercel → Add New Project → импорт репозитория.
3. Root Directory: `apps/mini-app`. Framework: Vite (подхватится из `apps/mini-app/vercel.json`). Остальное по умолчанию: pnpm-воркспейс Vercel находит по `pnpm-lock.yaml` в корне.
4. Deploy. Каждый push в `main` обновляет основную ссылку, ветки получают превью.
5. Превью-ссылки по умолчанию закрыты авторизацией Vercel (Settings → Deployment Protection) и в Telegram не откроются. Тестерам давать основную ссылку или отключить защиту для превью.

## Telegram

1. BotFather → `/mybots` → бот → Bot Settings → Menu Button → URL основной ссылки Vercel.
2. Прямая ссылка: BotFather → `/newapp` (Mini App с коротким именем) → `t.me/<bot>/<app>`; вход всегда на Планер (Q45).

## Коммерческая версия: Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → подключить тот же репозиторий.
2. Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm build`. Output directory: `apps/mini-app/dist`. Root directory: корень репозитория.
3. Кэш хэшированных ассетов: файл `apps/mini-app/public/_headers` (добавить при переезде, аналог `headers` из `vercel.json`).

## Проверка перед раздачей ссылки

1. `corepack pnpm test` и `corepack pnpm build` зелёные.
2. Ссылка открывается в Telegram на телефоне (iOS и Android), обе темы.
