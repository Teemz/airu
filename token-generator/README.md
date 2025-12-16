# Генератор JWT токенов для Airu

Простой скрипт для генерации JWT токенов для тестирования проекта Airu.

## Установка

1. Установите зависимости:
   ```bash
   cd token-generator
   npm install
   ```

## Использование

### Способ 1: Запуск напрямую
```bash
cd token-generator
node generate-token.js
```

### Способ 2: Использование npm script
```bash
cd token-generator
npm run generate
```

## Что делает скрипт

- Загружает переменные окружения из `backend/.env` файла
- Использует `JWT_SECRET` для подписи токена
- Генерирует токен с payload `{ id: 1 }`
- Срок действия токена: 24 часа
- Выводит токен в консоль

## Пример вывода

```
✅ Сгенерированный JWT токен:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY1MjY4MjkyLCJleHAiOjE3NjUzNTQ2OTJ9.h9ZFPdusGDbZYMJSK0erkmWV1kf2PYY_rDG2alQVHRE

💡 Payload: { id: 1 }
💡 Срок действия: 24 часа
```

## Требования

- Node.js
- Файл `backend/.env` с переменной `JWT_SECRET`