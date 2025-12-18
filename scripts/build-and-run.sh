#!/bin/bash

echo "Building frontend-chat-widget..."
cd frontend-chat-widget
npm run build
cd ..

echo "Building admin-panel..."
cd admin-panel
npm run build
cd ..

echo "Starting docker-compose..."
docker-compose -f docker-compose.local.yml up --build