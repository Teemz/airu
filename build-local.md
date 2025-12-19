# Руководство по локальному запуску проекта AIRU

## Предварительные требования

- Docker и Docker Compose
- Node.js 22+ (для локальной разработки)
- Git

## Быстрый запуск

### 1. Клонирование и настройка

```bash
# Клонирование репозитория
git clone <repository-url>
cd airu

# Создание необходимых директорий для volumes
mkdir -p npm_data npm_letsencrypt
```

### 2. Запуск всех сервисов

```bash
# Запуск в фоновом режиме
docker-compose -f docker-compose.local.yml up -d

# Или с выводом логов
docker-compose -f docker-compose.local.yml up
```

### 3. Инициализация nginx proxy

После запуска всех контейнеров выполните:

```bash
# Убедитесь что контейнер npm запущен
docker-compose -f docker-compose.local.yml ps npm

# Запустите скрипт инициализации
chmod +x scripts/init-nginx-proxy.sh
export NPM_IDENTITY="admin@example.com"
export NPM_PASSWORD="changeme"
bash scripts/init-nginx-proxy.sh
```

### 4. Проверка запуска

```bash
# Проверьте статус всех контейнеров
docker-compose -f docker-compose.local.yml ps

# Проверьте доступность доменов
curl -I http://admin.airu.local
curl -I http://widget.airu.local
curl -I http://api.airu.local/health
```

## Доступные сервисы

После успешного запуска будут доступны:

- **Админ-панель**: http://admin.airu.local
- **Чат-виджет**: http://widget.airu.local  
- **API**: http://api.airu.local
- **Nginx Proxy Manager Admin**: http://localhost:81
  - Логин: admin@example.com
  - Пароль: changeme

## Тестовые данные для входа

**Админ-панель:**
- Email: `test@business`
- Пароль: `password`

## Разработка

### Frontend (Admin Panel)

```bash
cd admin-panel
npm install
npm run dev
```

### Frontend (Chat Widget)

```bash
cd frontend-chat-widget
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Сборка production версий

### Сборка frontend приложений

```bash
# Admin Panel
cd admin-panel
npm run build

# Chat Widget  
cd frontend-chat-widget
npm run build
```

### Сборка backend

```bash
cd backend
npm run build
```

## Остановка сервисов

```bash
# Остановка всех сервисов
docker-compose -f docker-compose.local.yml down

# Остановка с удалением volumes (осторожно!)
docker-compose -f docker-compose.local.yml down -v
```

## Устранение неполадок

### Проблемы с авторизацией

1. Проверьте что база данных инициализирована:
```bash
docker-compose -f docker-compose.local.yml logs postgres
```

2. Убедитесь что тестовый пользователь создан:
```bash
docker-compose -f docker-compose.local.yml exec postgres psql -U airu -d airu -c "SELECT email FROM users WHERE email = 'test@business';"
```

### Проблемы с nginx proxy

1. Проверьте статус npm контейнера:
```bash
docker-compose -f docker-compose.local.yml logs npm
```

2. Перезапустите инициализацию:
```bash
bash scripts/init-nginx-proxy.sh
```

### Проблемы с доменами

1. Проверьте файл `/etc/hosts`:
```bash
sudo nano /etc/hosts
# Должна быть строка:
# 127.0.0.1 admin.airu.local widget.airu.local api.airu.local
```

### Логи сервисов

```bash
# Все логи
docker-compose -f docker-compose.local.yml logs

# Конкретный сервис
docker-compose -f docker-compose.local.yml logs backend
docker-compose -f docker-compose.local.yml logs admin-panel
docker-compose -f docker-compose.local.yml logs frontend-chat-widget
```

## Структура проекта

```
airu/
├── admin-panel/           # Админ-панель (React + Vite)
├── backend/              # Backend API (Node.js + Express)
├── frontend-chat-widget/ # Чат-виджет (React + Vite)
├── nginx/                # Nginx конфигурации
├── docker/               # Docker файлы и инициализация БД
├── scripts/              # Скрипты для запуска и настройки
└── docker-compose.local.yml # Локальная конфигурация
```

## Переменные окружения

Основные переменные находятся в файле `.env`:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` - настройки БД
- `JWT_SECRET` - секретный ключ для JWT токенов
- `NPM_IDENTITY`, `NPM_PASSWORD` - данные для Nginx Proxy Manager
- `OPENROUTER_API_KEY` - API ключ для OpenRouter

## Дополнительная информация

- **База данных**: PostgreSQL 16
- **Кэш**: Redis
- **Векторная БД**: ChromaDB
- **Proxy**: Nginx Proxy Manager
- **Node.js**: версия 22