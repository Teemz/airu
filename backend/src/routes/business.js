const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

const auth = require('../middleware/auth.js');
const { createCollection, addDocument, queryCollection, deleteDocument } = require('../services/chroma');
const { docProcessingQueue } = require('../app'); // Import the queue

// POST /business - Создать новый бизнес
router.post('/', auth, async (req, res) => {
  try {
    const { business_name } = req.body;
    if (!business_name || business_name.trim().length === 0) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Получить tariff_id пользователя
    const userResult = await pool.query(
      'SELECT tariff_id FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const tariffId = userResult.rows[0].tariff_id;

    // Получить max_businesses
    let maxBusinesses = 0;
    if (tariffId) {
      const tariffResult = await pool.query(
        'SELECT max_businesses FROM tariffs WHERE tariff_id = $1',
        [tariffId]
      );
      if (tariffResult.rows.length > 0) {
        maxBusinesses = tariffResult.rows[0].max_businesses;
      }
    }

    // Посчитать количество существующих бизнесов
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM businesses WHERE user_id = $1',
      [req.user.user_id]
    );
    const currentCount = parseInt(countResult.rows[0].count);

    // Проверить лимит
    if (maxBusinesses !== null && currentCount >= maxBusinesses) {
      return res.status(403).json({ error: 'Business limit exceeded. Please upgrade your tariff.' });
    }

    // Создать бизнес
    const result = await pool.query(
      'INSERT INTO businesses (user_id, business_name) VALUES ($1, $2) RETURNING business_id, user_id, business_name, created_at',
      [req.user.user_id, business_name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /business/tariff - Сменить тариф пользователя
router.put('/tariff', auth, async (req, res) => {
  try {
    const { tariff_id } = req.body;
    if (!tariff_id || isNaN(tariff_id)) {
      return res.status(400).json({ error: 'Valid tariff_id is required' });
    }

    // Проверить, что tariff_id существует
    const tariffResult = await pool.query(
      'SELECT tariff_id FROM tariffs WHERE tariff_id = $1',
      [tariff_id]
    );
    if (tariffResult.rows.length === 0) {
      return res.status(400).json({ error: 'Tariff not found' });
    }

    // Обновить tariff_id пользователя
    const result = await pool.query(
      'UPDATE users SET tariff_id = $1 WHERE user_id = $2 RETURNING user_id, tariff_id',
      [tariff_id, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tariff:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /business/add-test-job - Добавить тестовое задание в очередь
router.post('/add-test-job', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Получить business_id пользователя
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [req.user.user_id]
    );
    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const businessId = businessResult.rows[0].business_id;

    const job = await docProcessingQueue.add('test-job', {
      businessId: businessId,
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
      'SELECT business_id, business_name FROM businesses WHERE user_id = $1',
      [req.user.user_id]
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

// PUT /business/profile - Обновить профиль бизнеса (business_name)
router.put('/profile', auth, async (req, res) => {
  try {
    const { business_name } = req.body;
    if (!business_name || business_name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await pool.query(
      'UPDATE businesses SET business_name = $1 WHERE user_id = $2 RETURNING business_id, business_name',
      [business_name.trim(), req.user.user_id]
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
  console.log('POST /business/knowledge called with body:', req.body, 'user:', req.user);
  try {
    const { content, title } = req.body;
    if (!content || content.trim().length === 0) {
      console.log('Content is required');
      return res.status(400).json({ error: 'Content is required' });
    }

    // Получить business_id пользователя
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [req.user.user_id]
    );
    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const businessId = businessResult.rows[0].business_id;

    console.log('Inserting into knowledge:', businessId, content.trim());
    const result = await pool.query(
      'INSERT INTO knowledge (business_id, knowledge_title, content_type, chroma_id) VALUES ($1, $2, $3, $4) RETURNING knowledge_id, business_id, knowledge_title, content_type, chroma_id, created_at',
      [businessId, title || content.substring(0, 100), 'text', '']
    );
    console.log('Inserted:', result.rows[0]);

    // Добавить в Chroma
    try {
      const collectionName = `business_${businessId}`;
      await createCollection(collectionName);

      const chromaId = await addDocument(collectionName, content.trim(), {
        knowledge_id: result.rows[0].knowledge_id,
        business_id: businessId,
        title: title || content.substring(0, 100),
        content_type: 'text'
      });

      // Обновить chroma_id в БД
      await pool.query(
        'UPDATE knowledge SET chroma_id = $1 WHERE knowledge_id = $2',
        [chromaId, result.rows[0].knowledge_id]
      );

      console.log('Added to Chroma successfully');
    } catch (chromaError) {
      console.error('Error adding to Chroma:', chromaError);
      // Continue without failing the request
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error in POST /business/knowledge:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /business/knowledge - Список знаний бизнеса
router.get('/knowledge', auth, async (req, res) => {
  try {
    // Получить business_id пользователя
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [req.user.user_id]
    );
    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const businessId = businessResult.rows[0].business_id;

    const result = await pool.query(
      'SELECT knowledge_id, knowledge_title, content_type, file_path, chroma_id, created_at FROM knowledge WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
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

    // Получить business_id пользователя
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [req.user.user_id]
    );
    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const businessId = businessResult.rows[0].business_id;

    const collectionName = `business_${businessId}`;
    const matches = await queryCollection(collectionName, query.trim(), 5);

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /business/tariffs - Получить список доступных тарифов
router.get('/tariffs', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT tariff_id as id, tariff_name as name, max_businesses FROM tariffs ORDER BY tariff_id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tariffs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;