# Обслуживание Airu

Это руководство описывает процедуры регулярного обслуживания, обновления, резервного копирования и мониторинга приложения Airu.

## Обновление приложения

### Автоматическое обновление через GitHub Actions

Если настроен CI/CD pipeline в `.github/workflows/deploy.yml`:

1. **Подготовка релиза:**
   ```bash
   # Создание git tag
   git tag v1.2.3
   git push origin v1.2.3
   ```

2. **Мониторинг деплоя:**
   - Перейдите в Actions на GitHub
   - Следите за прогрессом деплоя
   - Проверьте логи на ошибки

3. **Проверка после обновления:**
   ```bash
   curl https://your-domain/health
   curl https://admin.your-domain
   curl https://api.your-domain/chat
   ```

### Ручное обновление

1. **Обновление кода:**
   ```bash
   # На сервере
   cd /path/to/airu
   git pull origin main
   ```

2. **Пересборка и перезапуск:**
   ```bash
   # Остановка сервисов
   docker-compose -f docker-compose.prod.yml down

   # Пересборка образов
   docker-compose -f docker-compose.prod.yml build --no-cache

   # Запуск
   docker-compose -f docker-compose.prod.yml up -d

   # Проверка
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **Обновление зависимостей:**
   ```bash
   # Backend
   docker exec -it airu-backend-1 npm update

   # Frontend (если нужно пересобрать)
   docker exec -it airu-admin-panel-1 npm run build
   ```

## Резервное копирование

### База данных PostgreSQL

**Ежедневный бэкап:**
```bash
#!/bin/bash
# Скрипт backup.sh

BACKUP_DIR="/opt/airu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="airu-postgres-1"

# Создание директории если не существует
mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec $CONTAINER pg_dump -U airu airu > $BACKUP_DIR/airu_$DATE.sql

# Сжатие
gzip $BACKUP_DIR/airu_$DATE.sql

# Удаление бэкапов старше 30 дней
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/airu_$DATE.sql.gz"
```

**Настройка cron:**
```bash
# Ежедневный бэкап в 2:00
0 2 * * * /opt/airu/backup.sh
```

### Pinecone индексы

**Экспорт векторов:**
```python
import pinecone
import json

# Инициализация
pinecone.init(api_key='your-api-key', environment='your-env')
index = pinecone.Index('airu-knowledge')

# Экспорт всех векторов
vectors = []
for ids in index.query(top_k=10000, include_values=True, include_metadata=True)['matches']:
    # Получить все вектора пачками
    pass

# Сохранение в JSON
with open('pinecone_backup.json', 'w') as f:
    json.dump(vectors, f)
```

### Конфигурационные файлы

**Бэкап настроек:**
```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/opt/airu/config_backups"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Бэкап .env файлов
tar -czf $BACKUP_DIR/env_$DATE.tar.gz \
  /path/to/airu/backend/.env \
  /path/to/airu/docker-compose.prod.yml \
  /path/to/airu/nginx/*.conf

# Бэкап Nginx Proxy Manager
docker exec airu-nginx-proxy-manager-1 sqlite3 /data/database.sqlite .dump > $BACKUP_DIR/npm_$DATE.sql
```

### Docker volumes

**Бэкап volumes:**
```bash
#!/bin/bash
# backup-volumes.sh

BACKUP_DIR="/opt/airu/volume_backups"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Бэкап PostgreSQL volume
docker run --rm -v airu_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_$DATE.tar.gz -C /data .

# Бэкап Nginx Proxy Manager
docker run --rm -v airu_nginx_proxy_manager_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/npm_$DATE.tar.gz -C /data .
```

## Восстановление из бэкапа

### Восстановление базы данных

```bash
# Остановка приложения
docker-compose -f docker-compose.prod.yml down

# Восстановление
cat backup.sql | docker exec -i airu-postgres-1 psql -U airu airu

# Запуск приложения
docker-compose -f docker-compose.prod.yml up -d
```

### Восстановление Pinecone

```python
import pinecone
import json

# Загрузка бэкапа
with open('pinecone_backup.json', 'r') as f:
    vectors = json.load(f)

# Восстановление
index.upsert(vectors=vectors)
```

## Мониторинг

### Системные метрики

**Установка Prometheus + Grafana:**
```bash
# Docker Compose для мониторинга
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
```

**Prometheus конфигурация:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'airu-backend'
    static_configs:
      - targets: ['backend:3002']
    metrics_path: '/metrics'

  - job_name: 'docker'
    static_configs:
      - targets: ['docker.for.mac.host.internal:9323']
```

### Health Checks

**Добавление health endpoints:**

```javascript
// backend/src/app.js
app.get('/health', (req, res) => {
  // Проверка подключения к БД
  // Проверка внешних API
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'ok',
      pinecone: 'ok',
      openrouter: 'ok'
    }
  });
});
```

**Мониторинг health checks:**
```bash
# Cron job для проверки
*/5 * * * * curl -f https://your-domain/health || echo "Health check failed" | mail -s "Airu Health Alert" admin@your-domain.com
```

### Логирование

**Централизованное логирование:**
```bash
# Использование ELK стека
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:7.10.0
    environment:
      discovery.type: single-node

  logstash:
    image: logstash:7.10.0
    volumes:
      - ./monitoring/logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:7.10.0
    ports:
      - "5601:5601"
```

**Docker logging драйвер:**
```yaml
# docker-compose.prod.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Алерты

**Настройка алертов:**

1. **UptimeRobot:**
   - Мониторинг доступности
   - Email/SMS алерты

2. **Prometheus Alertmanager:**
   ```yaml
   route:
     group_by: ['alertname']
     group_wait: 10s
     group_interval: 10s
     repeat_interval: 1h
     receiver: 'email'
   receivers:
   - name: 'email'
     email_configs:
     - to: 'admin@your-domain.com'
   ```

3. **Кастомные алерты:**
   ```bash
   # Проверка дискового пространства
   DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
   if [ $DISK_USAGE -gt 90 ]; then
     echo "Disk usage is $DISK_USAGE%" | mail -s "Disk Alert" admin@your-domain.com
   fi
   ```

## Производительность

### Оптимизация

**Database optimization:**
```sql
-- Создание индексов
CREATE INDEX CONCURRENTLY idx_messages_user_id ON messages(user_id);
CREATE INDEX CONCURRENTLY idx_messages_created_at ON messages(created_at DESC);

-- Анализ запросов
EXPLAIN ANALYZE SELECT * FROM messages WHERE user_id = $1;
```

**API optimization:**
```javascript
// Кэширование
const cache = require('memory-cache');

// Кэширование ответов на 5 минут
app.use((req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);
  if (cached) {
    return res.json(cached);
  }
  next();
});
```

**Frontend optimization:**
```bash
# Включение gzip в Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Масштабирование

**Горизонтальное масштабирование:**
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    depends_on:
      - loadbalancer

  loadbalancer:
    image: nginx:alpine
    volumes:
      - ./nginx/loadbalancer.conf:/etc/nginx/conf.d/default.conf
```

## Безопасность

### Регулярные аудиты

**Проверка уязвимостей:**
```bash
# Сканирование контейнеров
docker scan airu-backend

# Проверка зависимостей
npm audit
npm audit fix

# Сканирование секретов
trufflehog --regex --entropy=False .
```

**Обновление SSL сертификатов:**
```bash
# Автоматическое продление
certbot renew --quiet
```

### Доступ и аутентификация

**Управление доступом:**
```bash
# Ограничение SSH доступа
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
# PermitRootLogin no

# Настройка fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## Планы обслуживания

### Ежедневные задачи:
- [ ] Проверка логов на ошибки
- [ ] Мониторинг использования ресурсов
- [ ] Проверка доступности сервисов

### Еженедельные задачи:
- [ ] Создание бэкапов
- [ ] Обновление зависимостей
- [ ] Проверка SSL сертификатов
- [ ] Анализ производительности

### Ежемесячные задачи:
- [ ] Полное тестирование восстановления из бэкапа
- [ ] Аудит безопасности
- [ ] Обновление системных пакетов
- [ ] Анализ трендов использования

### Ежеквартальные задачи:
- [ ] Планирование масштабирования
- [ ] Обновление инфраструктуры
- [ ] Ревизия документации

## Контакты

**Экстренные случаи:**
- Email: admin@your-domain.com
- Phone: +7 (XXX) XXX-XX-XX

**Техническая поддержка:**
- GitHub Issues: https://github.com/your-org/airu/issues
- Документация: https://docs.airu.dev/maintenance