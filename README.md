# Airu: SAAS Чат-виджет с ИИ

## Описание

Monorepo для SAAS приложения с чат-виджетом на базе ИИ (OpenRouter via OpenAI SDK, Supabase, PostgreSQL).

**Архитектура:**
- Backend: Node.js/Express
- Frontend Widget: React (Vite)
- Admin Panel: React (Vite)
- БД: PostgreSQL
- Vector DB: Supabase
- Redis как брокер сообщений

## Структура проекта

- `backend/` - сервер API (Express)
- `frontend-chat-widget/` - чат-виджет для встраивания на сайты
- `admin-panel/` - административная панель
- `docker/` - Docker конфигурации

## Установка и запуск

```bash
npm install
```

## Запуск разработки

- Backend: `npm run backend:dev`
- Widget: `npm run widget:dev`
- Admin: `npm run admin:dev`
- Frontend (admin + widget): `npm run admin:dev` & `npm run widget:dev` (новые терминалы)

## Docker (Backend + Postgres)

Запуск/перезапуск:
```bash
docker-compose up -d  # первый запуск
docker-compose restart backend  # перезапуск backend (после .env)
docker-compose down  # остановка
```

Запуск Postgres + Backend:
```bash
docker-compose up -d postgres backend
```

## Полный стек разработки

1. Backend + DB: `docker-compose up -d`
2. Admin Panel: `npm run admin:dev` (~ http://localhost:5173)
3. Chat Widget: `npm run widget:dev` (~ http://localhost:5174)

**Тестовый логин Admin:** test@business.com / password

## Перезапуск после изменений .env

- Backend: `docker-compose restart backend`
- Frontend: Ctrl+C в терминалах + `npm run admin:dev` & `npm run widget:dev`

## Окружение (.env в backend/)

Создайте `.env` в `backend/` с:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/airu
OPENROUTER_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=your_env
JWT_SECRET=your_secret