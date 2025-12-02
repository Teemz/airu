const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { chat } = require('../services/rag.js');

router.post('/:businessId', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const businessId = req.params.businessId;

    const pool = new Pool({
      connectionString: process.env.DB_URL,
    });

    const result = await pool.query(
      'SELECT id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const response = await chat(message.trim(), businessId);
    res.json({ response });
  } catch (error) {
    console.error('Public chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;