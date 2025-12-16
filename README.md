# AIRU: SAAS Чат-виджет с ИИ

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
docker-compose -f docker-compose.local.yml up -d  # первый запуск
docker-compose -f docker-compose.local.yml restart backend  # перезапуск backend (после .env)
docker-compose -f docker-compose.local.yml down  # остановка
```

Запуск Postgres + Backend:
```bash
docker-compose -f docker-compose.local.yml up -d postgres backend
```

## Полный стек разработки

1. Backend + DB: `docker-compose -f docker-compose.local.yml up -d`
2. Admin Panel: `npm run admin:dev` (~ http://localhost:5173)
3. Chat Widget: `npm run widget:dev` (~ http://localhost:5174)

**Тестовый логин Admin:** test@business.com / password

## Локальное тестирование с Nginx Proxy Manager

Для локального тестирования с использованием Nginx Proxy Manager (NPM) выполните следующие шаги:

1. **Сборка фронтендов:**
   ```bash
   npm run build:widget
   npm run build:admin
   ```

2. **Запуск сервисов:**
   ```bash
   docker-compose -f docker-compose.local.yml up -d
   ```

3. **Настройка hosts файла:**
   Добавьте следующие строки в файл `/etc/hosts` (или `C:\Windows\System32\drivers\etc\hosts` на Windows):
   ```
   127.0.0.1 widget.airu.local
   127.0.0.1 admin.airu.local
   ```

4. **Доступ к админке NPM:**
   Откройте браузер и перейдите по адресу `http://localhost:81`.
   - Логин по умолчанию: `admin@example.com`
   - Пароль по умолчанию: `changeme`

5. **Настройка прокси-хостов в NPM:**
   - Войдите в админку NPM.
   - Перейдите в раздел "Proxy Hosts".
   - Создайте новый прокси-хост для `widget.airu.local`:
     - Domain Names: `widget.airu.local`
     - Forward Hostname / IP: `frontend-widget`
     - Forward Port: `80`
   - Создайте новый прокси-хост для `admin.airu.local`:
     - Domain Names: `admin.airu.local`
     - Forward Hostname / IP: `admin-panel`
     - Forward Port: `80`

6. **Тестирование настройки:**
   - Откройте `http://widget.airu.local` в браузере для доступа к чат-виджету.
   - Откройте `http://admin.airu.local` в браузере для доступа к административной панели.

**Остановка сервисов:**
```bash
docker-compose -f docker-compose.local.yml down
```

## Production Deployment

For production deployment:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

To stop:

```bash
docker-compose -f docker-compose.prod.yml down
```