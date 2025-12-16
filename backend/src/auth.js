const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database pool
const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO businesses (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      [email, passwordHash, name]
    );

    const token = jwt.sign(
      { id: result.rows[0].id },
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
      'SELECT id, password_hash FROM businesses WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id },
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
     'SELECT id, email, name FROM businesses WHERE id = $1',
     [decoded.id]
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