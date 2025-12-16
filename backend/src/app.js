require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRouter = require('./auth'); // auth.js routes

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS for frontend (adjust origins as needed)
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://widget.airu.local',
    'http://admin.airu.local'
  ],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/auth', authRouter);
const businessRouter = require('./routes/business');
app.use('/business', businessRouter);

const chatRouter = require('./routes/chat');
app.use('/chat', chatRouter);

const publicChatRouter = require('./routes/public-chat');
app.use('/public/chat', publicChatRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});