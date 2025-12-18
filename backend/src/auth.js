const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Database pool
const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const { email, password, confirmPassword } = req.body;

    // Валидация
    if (!email || !password) {
      console.log('Validation failed: email or password missing');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Получить tariff_id для 'Стартап'
    const tariffResult = await pool.query(
      'SELECT tariff_id FROM tariffs WHERE tariff_name = $1',
      ['Стартап']
    );

    if (tariffResult.rows.length === 0) {
      return res.status(500).json({ error: 'Tariff not found' });
    }

    const tariffId = tariffResult.rows[0].tariff_id;

    // Создаем пользователя
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, tariff_id) VALUES ($1, $2, $3) RETURNING user_id',
      [email, passwordHash, tariffId]
    );

    const userId = userResult.rows[0].user_id;

    // Создаем бизнес
    await pool.query(
      'INSERT INTO businesses (user_id, business_name) VALUES ($1, $2)',
      [userId, null]
    );

    // Отправка email подтверждения
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Подтверждение регистрации',
      text: `Здравствуйте!\n\nВы успешно зарегистрировались в системе. Ваш email: ${email}\n\nС уважением,\nКоманда поддержки`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    const token = jwt.sign(
      { user_id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT user_id, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /me - Получить информацию о текущем пользователе
router.get('/me', async (req, res) => {
  try {
   const authHeader = req.headers.authorization;
   if (!authHeader || !authHeader.startsWith('Bearer ')) {
     return res.status(401).json({ error: 'No token provided' });
   }

   const token = authHeader.substring(7);
   const decoded = jwt.verify(token, process.env.JWT_SECRET);

   const result = await pool.query(
     'SELECT user_id, email FROM users WHERE user_id = $1',
     [decoded.user_id]
   );

   if (result.rows.length === 0) {
     return res.status(404).json({ error: 'User not found' });
   }

   res.json(result.rows[0]);
 } catch (error) {
   if (error.name === 'JsonWebTokenError') {
     return res.status(401).json({ error: 'Invalid token' });
   }
   console.error(error);
   res.status(500).json({ error: 'Server error' });
 }
});

module.exports = router;