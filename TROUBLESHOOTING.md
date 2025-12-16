# Решение проблем Airu

Это руководство содержит решения наиболее распространенных проблем при развертывании и эксплуатации Airu.

## Проблемы с развертыванием

### Docker контейнеры не запускаются

**Симптомы:**
```
ERROR: Service 'backend' failed to build
```

**Решения:**
1. Проверьте логи сборки:
   ```bash
   docker-compose -f docker-compose.prod.yml build --no-cache
   docker-compose -f docker-compose.prod.yml logs backend
   ```

2. Убедитесь что Dockerfile.prod существует:
   ```bash
   ls -la Dockerfile.prod
   ```

3. Проверьте переменные окружения:
   ```bash
   cat backend/.env
   ```

### Ошибка подключения к базе данных

**Симптомы:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Решения:**
1. Проверьте статус PostgreSQL контейнера:
   ```bash
   docker-compose -f docker-compose.prod.yml ps postgres
   ```

2. Проверьте логи PostgreSQL:
   ```bash
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

3. Убедитесь в правильности DB_URL в backend/.env:
   ```bash
   # Для Docker Compose используйте имя сервиса
   DB_URL=postgresql://airu:airupass@postgres:5432/airu
   ```

4. Проверьте инициализацию базы данных:
   ```bash
   docker exec -it airu-postgres-1 psql -U airu -d airu -c "SELECT version();"
   ```

### Nginx Proxy Manager не доступен

**Симптомы:**
```
Connection refused on port 81
```

**Решения:**
1. Проверьте статус контейнера:
   ```bash
   docker-compose -f docker-compose.prod.yml ps nginx-proxy-manager
   ```

2. Проверьте логи:
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx-proxy-manager
   ```

3. Убедитесь что порт 81 не занят:
   ```bash
   sudo netstat -tulpn | grep :81
   ```

4. Перезапустите сервис:
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx-proxy-manager
   ```

## Проблемы с SSL сертификатами

### Let's Encrypt сертификат не выдается

**Симптомы:**
```
SSL certificate validation failed
```

**Решения:**
1. Проверьте DNS настройки:
   ```bash
   nslookup your-domain.com
   ```

2. Убедитесь что домен резолвится на IP вашего VPS

3. Проверьте firewall:
   ```bash
   sudo ufw status
   # Должен быть открыт порт 80
   ```

4. Попробуйте ручную выдачу сертификата:
   ```bash
   docker exec -it nginx-proxy-manager certbot certonly --webroot -w /usr/share/nginx/html -d your-domain.com
   ```

### SSL сертификат истек

**Решения:**
1. Через Nginx Proxy Manager:
   - Войдите в админку (порт 81)
   - Перейдите в SSL Certificates
   - Выберите сертификат и нажмите "Renew"

2. Автоматическое продление:
   ```bash
   # Добавьте в crontab для еженедельной проверки
   0 12 * * 1 docker exec nginx-proxy-manager /app/certbot-renew.sh
   ```

## Проблемы с API ключами

### Pinecone API ошибки

**Симптомы:**
```
PineconeError: API key is invalid
```

**Решения:**
1. Проверьте API ключ в backend/.env:
   ```bash
   echo $PINECONE_API_KEY
   ```

2. Убедитесь что ключ активен на pinecone.io

3. Проверьте environment и индекс:
   ```bash
   curl -X GET "https://api.pinecone.io/indexes" \
     -H "Api-Key: YOUR_PINECONE_API_KEY"
   ```

4. Создайте индекс если он не существует:
   ```bash
   curl -X POST "https://api.pinecone.io/indexes" \
     -H "Api-Key: YOUR_PINECONE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "airu-knowledge",
       "dimension": 1536,
       "metric": "cosine"
     }'
   ```

### OpenRouter API ошибки

**Симптомы:**
```
OpenRouterError: Authentication failed
```

**Решения:**
1. Проверьте баланс на openrouter.ai

2. Проверьте API ключ:
   ```bash
   curl -X GET "https://openrouter.ai/api/v1/auth/key" \
     -H "Authorization: Bearer YOUR_OPENROUTER_API_KEY"
   ```

3. Проверьте квоты использования

## Проблемы с производительностью

### Высокое использование CPU

**Решения:**
1. Проверьте логи на ошибки:
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100 backend
   ```

2. Мониторьте ресурсы:
   ```bash
   docker stats
   ```

3. Оптимизируйте Node.js приложение:
   - Используйте PM2 для кластеризации
   - Настройте garbage collection
   - Проверьте на memory leaks

### Высокое использование памяти

**Решения:**
1. Проверьте лимиты Docker:
   ```yaml
   # В docker-compose.prod.yml
   backend:
     deploy:
       resources:
         limits:
           memory: 512M
         reservations:
           memory: 256M
   ```

2. Мониторьте использование:
   ```bash
   docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
   ```

3. Оптимизируйте приложение:
   - Используйте streaming для больших ответов
   - Очистите неиспользуемые зависимости

### Медленная загрузка страниц

**Решения:**
1. Проверьте сетевые задержки:
   ```bash
   ping your-domain.com
   ```

2. Оптимизируйте frontend:
   - Включите gzip compression в Nginx
   - Настройте caching headers
   - Минифицируйте assets

3. Проверьте backend performance:
   ```bash
   # Используйте Apache Bench для тестирования
   ab -n 100 -c 10 https://your-domain/
   ```

## Проблемы с сетью и доступностью

### Сервис недоступен извне

**Решения:**
1. Проверьте firewall:
   ```bash
   sudo ufw status
   # Должны быть открыты порты 80, 443, 81
   ```

2. Проверьте Docker networking:
   ```bash
   docker network ls
   docker network inspect airu_app_network
   ```

3. Проверьте Nginx Proxy Manager конфигурацию

### Internal Server Error (500)

**Решения:**
1. Проверьте логи backend:
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```

2. Проверьте подключение к базе данных:
   ```bash
   docker exec -it airu-backend-1 node -e "require('pg').connect(process.env.DB_URL, (err) => console.log(err || 'Connected'))"
   ```

3. Проверьте переменные окружения:
   ```bash
   docker exec -it airu-backend-1 env | grep -E "(DB_URL|JWT_SECRET)"
   ```

## Проблемы с данными

### Потеря данных в базе

**Решения:**
1. Восстановление из бэкапа:
   ```bash
   docker exec -i airu-postgres-1 psql -U airu airu < backup.sql
   ```

2. Проверьте целостность данных:
   ```bash
   docker exec -it airu-postgres-1 psql -U airu -d airu -c "SELECT count(*) FROM your_table;"
   ```

### Коррупция индекса Pinecone

**Решения:**
1. Создайте новый индекс

2. Переиндексируйте данные:
   ```bash
   # В backend контейнере
   npm run reindex
   ```

## Системные проблемы

### Недостаточно дискового пространства

**Решения:**
1. Проверьте использование диска:
   ```bash
   df -h
   du -sh /var/lib/docker/volumes/
   ```

2. Очистите Docker:
   ```bash
   docker system prune -f
   docker volume prune -f
   ```

3. Увеличьте дисковое пространство VPS

### Перегрузка системы

**Решения:**
1. Проверьте процессы:
   ```bash
   top
   htop
   ```

2. Ограничьте ресурсы в Docker Compose:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 1G
   ```

3. Настройте swap:
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

## Мониторинг и алерты

### Настройка алертов

1. Используйте healthcheck endpoints:
   ```bash
   curl https://api.your-domain/health
   ```

2. Настройте мониторинг с алертами:
   - UptimeRobot для внешнего мониторинга
   - Prometheus Alertmanager для внутреннего
   - Настройте email/SMS уведомления

### Логирование ошибок

1. Централизованное логирование:
   ```bash
   # Используйте ELK stack или Loki + Grafana
   ```

2. Структурированное логирование в приложении:
   ```javascript
   console.error(JSON.stringify({
     level: 'error',
     message: 'Database connection failed',
     error: err.message,
     timestamp: new Date().toISOString()
   }));
   ```

## Контакты и поддержка

Если проблема не решена:
1. Соберите информацию:
   - Логи всех сервисов
   - Конфигурационные файлы (без секретов)
   - Описание шагов для воспроизведения

2. Создайте issue в GitHub с меткой "bug"

3. Свяжитесь с командой разработки

## Профилактика

### Регулярные проверки:
- [ ] Ежедневно: логи на ошибки
- [ ] Еженедельно: использование ресурсов
- [ ] Ежемесячно: обновления и бэкапы
- [ ] Ежеквартально: аудит безопасности

### Автоматизация:
- Настройте автоматические бэкапы
- Мониторьте ключевые метрики
- Настройте алерты для критических ошибок