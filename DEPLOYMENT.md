# Руководство по развертыванию Airu

Это руководство предназначено для развертывания приложения Airu на VPS. Оно ориентировано на разработчиков, работающих на Windows 10, но включает шаги для настройки сервера на Linux (Ubuntu/Debian).

## Предварительные требования

- VPS с Ubuntu 20.04 или выше (рекомендуется DigitalOcean, Vultr или Hetzner)
- Минимум 2 ГБ RAM, 1 CPU, 20 ГБ SSD
- Домен (рекомендуется через Namecheap или GoDaddy)
- SSH-доступ к серверу

## Шаг 1: Подготовка VPS

### Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### Установка Docker и Docker Compose
```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений
sudo reboot
```

### Настройка firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

## Шаг 2: Клонирование проекта

```bash
git clone https://github.com/your-username/airu.git
cd airu
```

## Шаг 3: Конфигурация доменов

### Настройка DNS
1. В панели управления доменом добавьте A-записи:
   - `@` -> IP-адрес вашего VPS
   - `www` -> IP-адрес вашего VPS (опционально)
   - `api` -> IP-адрес вашего VPS (для API)
   - `admin` -> IP-адрес вашего VPS (для админ-панели)

2. Дождитесь распространения DNS (может занять до 24 часов)

### Установка Nginx Proxy Manager

Используйте готовый скрипт:
```bash
chmod +x scripts/init-nginx-proxy.sh
./scripts/init-nginx-proxy.sh
```

Или настройте вручную:
```bash
# Создание сети
docker network create nginx-proxy

# Запуск Nginx Proxy Manager
docker run -d \
  --name nginx-proxy-manager \
  --network nginx-proxy \
  -p 80:80 \
  -p 443:443 \
  -p 81:81 \
  -v nginx-proxy-manager:/data \
  -v /etc/letsencrypt:/etc/letsencrypt \
  jc21/nginx-proxy-manager:latest
```

## Шаг 4: Настройка SSL-сертификатов

### Через Nginx Proxy Manager (рекомендуется)
1. Откройте http://your-domain:81
2. Логин: admin@example.com / changeme
3. Добавьте прокси-хосты для каждого сервиса:
   - Frontend Chat Widget: your-domain -> http://frontend-chat-widget:3000
   - Admin Panel: admin.your-domain -> http://admin-panel:3001
   - Backend API: api.your-domain -> http://backend:3002
4. Включите SSL для каждого хоста (Let's Encrypt)

### Альтернативно: Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Шаг 5: Развертывание приложения

### Копирование файлов на сервер
Используйте SCP или SFTP для загрузки файлов проекта на сервер.

### Настройка переменных окружения
Скопируйте `.env.example` в `.env` и заполните значения (см. CONFIGURATION.md)

### Запуск приложения
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Проверка развертывания
```bash
docker-compose -f docker-compose.prod.yml ps
curl https://your-domain
curl https://admin.your-domain
curl https://api.your-domain/health
```

### Текущая модель ИИ
Приложение использует модель `tngtech/deepseek-r1t2-chimera:free` от OpenRouter. DeepSeek R1 - модель, ориентированная на reasoning, с гибридной архитектурой Chimera для оптимального баланса скорости и качества ответов.

## Шаг 6: Мониторинг и логи

### Просмотр логов
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Настройка мониторинга
Установите monitoring tools как Prometheus + Grafana или используйте встроенные инструменты.

## Возможные проблемы

- Если порты заняты: `sudo netstat -tulpn | grep :80`
- Если SSL не работает: проверьте DNS propagation
- Если контейнеры не запускаются: проверьте логи и переменные окружения

Для детального troubleshooting см. TROUBLESHOOTING.md