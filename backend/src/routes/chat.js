const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.js');
const { chat } = require('../services/rag.js');

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chat(message.trim(), req.user.id);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;