const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

const auth = require('../middleware/auth.js');
const { generateEmbedding, upsertVectors, queryVectors } = require('../services/supabase-vector');
const { docProcessingQueue } = require('../app'); // Import the queue

// POST /business/add-test-job - Добавить тестовое задание в очередь
router.post('/add-test-job', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const job = await docProcessingQueue.add('test-job', {
      businessId: req.user.id,
      content: message.trim(),
      timestamp: new Date().toISOString()
    });

    console.log(`Job ${job.id} added to queue with message: "${message}"`);
    res.status(202).json({
      status: 'Job added',
      jobId: job.id,
      message: `Test job with ID ${job.id} added to queue.`
    });
  } catch (error) {
    console.error('Error adding job to queue:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /business/profile - Получить профиль бизнеса
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name FROM businesses WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /business/profile - Обновить профиль бизнеса (name)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await pool.query(
      'UPDATE businesses SET name = $1 WHERE id = $2 RETURNING id, email, name',
      [name.trim(), req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /business/knowledge - Добавить knowledge (text)
router.post('/knowledge', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const result = await pool.query(
      'INSERT INTO knowledge (business_id, content) VALUES ($1, $2) RETURNING id, business_id, content, created_at',
      [req.user.id, content.trim()]
    );

    // Generate embedding and upsert to Supabase Vector
    const embedding = await generateEmbedding(content.trim());
    const vectorId = result.rows[0].id.toString();
    await upsertVectors([{
      id: vectorId,
      embedding: embedding,
      metadata: {
        business_id: req.user.id,
        content: content.trim()
      }
    }]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /business/knowledge - Список знаний бизнеса
router.get('/knowledge', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, content, created_at FROM knowledge WHERE business_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
// GET /business/knowledge/search?query=... (protected)
router.get('/knowledge/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryEmbedding = await generateEmbedding(query.trim());
    const matches = await queryVectors(queryEmbedding, 5, { business_id: req.user.id });

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;