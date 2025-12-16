const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Функция для загрузки переменных окружения из .env файла
function loadEnv() {
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Файл .env не найден в папке backend');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
}

// Загружаем переменные окружения
loadEnv();

// Получаем JWT_SECRET из переменных окружения
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ Переменная JWT_SECRET не найдена в .env файле');
  process.exit(1);
}

// Генерируем токен с payload { id: 1 }
const payload = { id: 1 };
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('✅ Сгенерированный JWT токен:');
console.log(token);
console.log('\n💡 Payload: { id: 1 }');
console.log('💡 Срок действия: 24 часа');