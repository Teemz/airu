#!/bin/bash

# Wait for Nginx Proxy Manager to be ready
echo "Waiting for Nginx Proxy Manager to be ready..."
until curl -s http://nginx-proxy-manager:81 > /dev/null; do
  sleep 5
done

echo "Nginx Proxy Manager is ready. Starting configuration..."

# Login to get token
TOKEN=$(curl -s -X POST http://nginx-proxy-manager:81/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"identity":"${NPM_IDENTITY}","secret":"${NPM_PASSWORD}"}' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to authenticate with Nginx Proxy Manager"
  exit 1
fi

echo "Authenticated successfully. Token: ${TOKEN:0:20}..."

# Create proxy host for admin-panel
echo "Creating proxy host for admin-panel..."
curl -s -X POST http://nginx-proxy-manager:81/api/nginx/proxy-hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_names": ["admin.airu.local"],
    "forward_scheme": "http",
    "forward_host": "admin-panel",
    "forward_port": 80,
    "access_list_id": 0,
    "certificate_id": 0,
    "ssl_forced": false,
    "enabled": true
  }'

# Create proxy host for frontend-chat-widget
echo "Creating proxy host for frontend-chat-widget..."
curl -s -X POST http://nginx-proxy-manager:81/api/nginx/proxy-hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_names": ["widget.airu.local"],
    "forward_scheme": "http",
    "forward_host": "frontend-chat-widget",
    "forward_port": 80,
    "access_list_id": 0,
    "certificate_id": 0,
    "ssl_forced": false,
    "enabled": true
  }'

# Create proxy host for backend API
echo "Creating proxy host for backend API..."
curl -s -X POST http://nginx-proxy-manager:81/api/nginx/proxy-hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_names": ["api.airu.local"],
    "forward_scheme": "http",
    "forward_host": "backend",
    "forward_port": 3001,
    "access_list_id": 0,
    "certificate_id": 0,
    "ssl_forced": false,
    "enabled": true
  }'

echo "Configuration completed successfully!"