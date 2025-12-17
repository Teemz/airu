require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRouter = require('./auth'); // auth.js routes

const { Queue } = require('bullmq');

const docProcessingQueue = new Queue('doc-processing', {
    connection: {
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379
    }
});

module.exports = { docProcessingQueue };

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
app.use('/api/auth', authRouter);
const businessRouter = require('./routes/business');
app.use('/api/business', businessRouter);

const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);

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