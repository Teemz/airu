# План изменений в базе данных и архитектуре

## Текущая структура
- Таблица `businesses`: id, email, password_hash, name, created_at
- Таблица `knowledge`: id, business_id, content, created_at

## Новая структура
### Архитектура баз данных
- PostgreSQL для основных данных (users, tariffs, businesses, knowledge metadata)
- Chroma для векторных данных knowledge (embeddings и content)
- Chroma запускается в Docker с встроенной моделью embedding
- Одна коллекция на бизнес для изоляции данных

- Таблица `users`: user_id (primary), email, password_hash, created_at
- Таблица `tariffs`: tariff_id (primary), tariff_name, max_businesses, features (JSON для ограничений)
  - Стартап: max_businesses=1, только текст
  - Основатель: max_businesses=5, файлы разрешены
  - Холдинг: max_businesses=15, файлы разрешены
  - Партнер: max_businesses=NULL (бесконечно), все функции
- Таблица `businesses`: business_id (primary), user_id (foreign), business_name, created_at
- Таблица `knowledge`: knowledge_id (primary), business_id (foreign), knowledge_title, content_type, file_path (опционально), chroma_id (ссылка на Chroma document), created_at
  - content_type: 'text', 'pdf', 'excel', 'word', 'txt'
  - Метаданные хранятся в PostgreSQL, векторы и content в Chroma
  - chroma_id: ID документа в Chroma collection для данного бизнеса

## Инструкция по реализации

### Шаг 1: Удаление старой базы данных
- Удалить существующую базу данных PostgreSQL
- Создать новую чистую базу данных

### Шаг 2: Новая схема базы данных (обновить docker/init.sql)
```sql
-- Initialize users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize tariffs table
CREATE TABLE IF NOT EXISTS tariffs (
  tariff_id SERIAL PRIMARY KEY,
  tariff_name VARCHAR(255) NOT NULL,
  max_businesses INTEGER,
  features JSONB DEFAULT '{}'
);

-- Initialize businesses table
CREATE TABLE IF NOT EXISTS businesses (
  business_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize knowledge table
CREATE TABLE IF NOT EXISTS knowledge (
  knowledge_id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
  knowledge_title VARCHAR(255),
  content_type VARCHAR(50) DEFAULT 'text',
  file_path VARCHAR(500),
  chroma_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert tariffs
INSERT INTO tariffs (tariff_name, max_businesses, features) VALUES
('Стартап', 1, '{"file_upload": false}'),
('Основатель', 5, '{"file_upload": true}'),
('Холдинг', 15, '{"file_upload": true}'),
('Партнер', NULL, '{"file_upload": true}') ON CONFLICT DO NOTHING;
```

### Шаг 3: Добавить Chroma в Docker Compose
Обновить docker-compose.local.yml и docker-compose.prod.yml:
```yaml
chroma:
  image: chromadb/chroma:latest
  ports:
    - "8000:8000"
  volumes:
    - chroma_data:/chroma/chroma
```

### Шаг 4: Обновить код бэкенда

#### Создать backend/src/services/chroma.js
Сервис для работы с Chroma API: создание коллекций на бизнес, добавление документов, поиск по векторам.

#### Обновить backend/src/auth.js
- Регистрация: вставка в users, автоматическое создание бизнеса с тарифом "Стартап"
- Логин: запрос из users
- Использовать user_id вместо id

#### Обновить backend/src/routes/business.js
- Использовать user_id из токена для получения business_id
- Проверка тарифа при создании бизнеса и загрузке файлов
- Поддержка загрузки файлов (PDF, Excel, Word, TXT) с парсингом текста
- Интеграция с Chroma для хранения embeddings

#### Обновить middleware/auth.js
- Декодировать user_id из токена

### Шаг 5: Добавить зависимости
Установить пакеты: chromadb, pdf-parse, mammoth, xlsx

### Шаг 6: Обновить фронтенд
- Добавить интерфейс для загрузки файлов
- Отображение тарифов и ограничений
- Проверка прав на загрузку файлов

### Шаг 7: Тестирование
- Регистрация нового пользователя
- Автоматическое создание бизнеса
- Загрузка текста и файлов
- Поиск по knowledge