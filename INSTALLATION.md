# Установка и настройка сервиса Airu

## Предварительные требования

Перед установкой убедитесь, что на вашем компьютере установлены следующие компоненты:

- Node.js версии 18 или выше
- Docker и Docker Compose
- Git
- Аккаунт в Supabase (для настройки векторной базы данных)

## Шаг 1: Клонирование репозитория

```bash
git clone <repository-url>
cd airu
```

## Шаг 2: Установка зависимостей

Установите зависимости для всего проекта:

```bash
npm install
```

## Шаг 3: Настройка Supabase Vector

1. Перейдите на [supabase.com](https://supabase.com) и создайте новый проект.

2. В панели управления проектом перейдите в раздел "Vector" или "Database" > "Vector".

3. Создайте новую векторную базу данных с следующими параметрами:
   - Название: `airu_vectors`
   - Размерность: 1536 (для OpenAI embeddings)
   - Метрика: cosine

4. Получите URL проекта и API ключ из настроек проекта.

## Шаг 4: Настройка переменных окружения

Создайте файл `.env` в директории `backend/`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/airu
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

Замените плейсхолдеры на реальные значения:
- `SUPABASE_URL`: URL вашего проекта Supabase
- `SUPABASE_ANON_KEY`: Анонимный ключ API
- `SUPABASE_SERVICE_ROLE_KEY`: Сервисный ключ роли
- `OPENROUTER_API_KEY`: Ключ API от OpenRouter
- `JWT_SECRET`: Секретный ключ для JWT (сгенерируйте случайную строку)

## Шаг 5: Запуск сервиса локально

1. Запустите базу данных PostgreSQL:

```bash
docker-compose up -d postgres
```

2. Запустите backend:

```bash
docker-compose up -d backend
```

3. Запустите админ-панель:

```bash
npm run admin:dev
```

Админ-панель будет доступна по адресу http://localhost:5173

4. Запустите чат-виджет для тестирования:

```bash
npm run widget:dev
```

Чат-виджет будет доступен по адресу http://localhost:5174

## Шаг 6: Проверка установки

1. Откройте админ-панель в браузере.
2. Войдите с тестовыми учетными данными: test@business.com / password
3. Убедитесь, что все сервисы работают корректно.

## Дополнительные команды

- Перезапуск backend после изменений .env: `docker-compose restart backend`
- Остановка всех сервисов: `docker-compose down`
- Просмотр логов: `docker-compose logs -f backend`

## Устранение неполадок

Если возникают проблемы:
1. Проверьте, что все переменные окружения указаны корректно.
2. Убедитесь, что порты 5432, 3000, 5173, 5174 свободны.
3. Проверьте логи Docker: `docker-compose logs`