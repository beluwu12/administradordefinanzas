/**
 * Updated Main Server Entry Point
 * With Helmet security headers, global error handling, rate limiting, and Winston logging
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./db');
const { logger } = require('./utils/logger');

// Middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// Helmet: Set various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API-only server
  crossOriginEmbedderPolicy: false
}));

// CORS: Restrictive configuration for production
const allowedOrigins = [
  'https://finanzas-frontend.orangeflower-43ff1781.eastus.azurecontainerapps.io',
  'https://gestorfinanciero.emprende.ve',  // Custom domain
  'https://www.gestorfinanciero.emprende.ve',  // Custom domain with www
  'http://localhost:5173',  // Vite dev server
  'http://localhost:4173',  // Vite preview
  'http://localhost',       // Docker nginx (port 80)
  'http://localhost:80',    // Docker nginx explicit
  'http://127.0.0.1',       // Localhost IP
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased for development
  message: {
    success: false,
    error: 'Demasiados intentos, intenta de nuevo en 15 minutos',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting ONLY to PIN verification (most sensitive)
app.use('/api/users/verify', authLimiter);

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const tagRoutes = require('./routes/tags');
const fixedExpenseRoutes = require('./routes/fixedExpenses');
const goalRoutes = require('./routes/goals');
const insightRoutes = require('./routes/insight');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth'); // New Auth Routes
const { initCronJobs } = require('./cron/reminderJobs');

// Enable Cron Jobs if configured
if (process.env.CRON_ENABLED === 'true' || true) { // Force enable for now based on user request
  initCronJobs();
}

app.use('/api/auth', authRoutes); // Auth mount point
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/insight', insightRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/exchange-rate', require('./routes/exchangeRate'));

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      message: 'Personal Finance API is running',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SCHEDULED TASKS
// ═══════════════════════════════════════════════════════════════

const cron = require('node-cron');
const { updateExchangeRate } = require('./services/bcvScraper');

// Schedule: At minute 0 past hour 8, 16, and 0
cron.schedule('0 8,16,0 * * *', async () => {
  logger.info('Running scheduled BCV rate update', { job: 'bcv-rate' });
  await updateExchangeRate();
});

// Run once on startup (non-blocking)
updateExchangeRate();

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING (must be last)
// ═══════════════════════════════════════════════════════════════

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  logger.info('═══════════════════════════════════════════════════════');
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📡 API Health: http://localhost:${PORT}/api/health`);
  logger.info('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
