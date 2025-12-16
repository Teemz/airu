# Конфигурация Airu

Это руководство описывает все необходимые переменные окружения, API ключи и секреты для развертывания Airu.

## Переменные окружения Backend

Создайте файл `backend/.env` на основе `backend/.env.example`:

### База данных
```bash
DB_URL=postgresql://airu:airupass@postgres:5432/airu
```
- **Описание**: URL подключения к PostgreSQL базе данных
- **Формат**: `postgresql://username:password@host:port/database`
- **Значение по умолчанию**: Указано в docker-compose.prod.yml
- **Примечание**: В продакшене используйте сильный пароль

### JWT Secret
```bash
JWT_SECRET=your_jwt_secret_here_change_in_production
```
- **Описание**: Секретный ключ для подписи JWT токенов
- **Генерация**: `openssl rand -hex 32` или `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Требования**: Минимум 32 символа, используйте только в продакшене
- **Безопасность**: Никогда не коммитите в Git, храните в секретах CI/CD

### Pinecone (Векторная база данных)
```bash
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=your_index_name_here
```

#### Получение API ключа Pinecone:
1. Зарегистрируйтесь на [pinecone.io](https://pinecone.io)
2. Создайте новый проект
3. Перейдите в API Keys в левом меню
4. Скопируйте API Key
5. Создайте новый индекс:
   - Name: `airu-knowledge` (или любое другое)
   - Dimension: 1536 (для OpenAI embeddings)
   - Metric: cosine
   - Environment: gcp-starter (бесплатный tier)

### OpenRouter (AI API)
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

#### Получение API ключа OpenRouter:
1. Зарегистрируйтесь на [openrouter.ai](https://openrouter.ai)
2. Перейдите в API Keys
3. Создайте новый API Key
4. **Важно**: Добавьте кредиты на баланс (минимум $5 для тестирования)

#### Текущая модель ИИ:
- **Модель**: `tngtech/deepseek-r1t2-chimera:free`
- **Характеристики**: DeepSeek R1 - модель, ориентированная на reasoning (логическое мышление). Chimera - гибридная архитектура для баланса скорости и качества. Подходит для задач, требующих глубокого анализа и структурированных ответов.

## Переменные окружения для Docker Compose

В `docker-compose.prod.yml` уже настроены базовые переменные:

### PostgreSQL
```yaml
environment:
  POSTGRES_DB: airu
  POSTGRES_USER: airu
  POSTGRES_PASSWORD: airupass
```
- **Рекомендация**: Измените пароль на более сильный в продакшене

### Backend
```yaml
environment:
  NODE_ENV: production
  DB_URL: postgresql://airu:airupass@postgres:5432/airu
```

## Секреты для CI/CD (GitHub Actions)

Если используете `.github/workflows/deploy.yml`, добавьте секреты в GitHub:

### Обязательные секреты:
- `PINECONE_API_KEY`: Ваш Pinecone API ключ
- `PINECONE_ENVIRONMENT`: Окружение Pinecone (например, gcp-starter)
- `PINECONE_INDEX_NAME`: Название индекса Pinecone
- `OPENROUTER_API_KEY`: OpenRouter API ключ
- `JWT_SECRET`: JWT секрет для продакшена
- `DB_PASSWORD`: Пароль для PostgreSQL (если отличается от airupass)

### Опциональные секреты:
- `DOCKERHUB_USERNAME`: Для публикации образов
- `DOCKERHUB_TOKEN`: Токен Docker Hub
- `SSH_PRIVATE_KEY`: Для деплоя на VPS
- `SERVER_HOST`: IP или домен VPS

## Проверка конфигурации

### Тестирование переменных окружения:
```bash
# В директории backend
node -e "require('dotenv').config(); console.log('DB_URL:', process.env.DB_URL ? 'OK' : 'MISSING'); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : 'MISSING');"
```

### Тестирование API ключей:
```bash
# Проверка Pinecone
curl -X GET "https://api.pinecone.io/indexes" \
  -H "Api-Key: YOUR_PINECONE_API_KEY" \
  -H "Content-Type: application/json"

# Проверка OpenRouter
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "openai/gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Безопасность

### Лучшие практики:
1. **Никогда не коммитите `.env` файлы** в Git
2. Используйте разные секреты для development и production
3. Регулярно ротируйте API ключи
4. Ограничьте доступ к секретам только необходимым сервисам
5. Мониторьте использование API для обнаружения утечек

### Хранение секретов:
- **Development**: `.env` файлы (добавьте в .gitignore)
- **Production**: Переменные окружения в Docker или секреты CI/CD
- **VPS**: Используйте `.env` файлы или systemd environment files

## Troubleshooting

Если приложение не запускается:
1. Проверьте логи: `docker-compose logs backend`
2. Убедитесь что все переменные установлены
3. Проверьте подключение к внешним сервисам
4. См. TROUBLESHOOTING.md для детальных решений