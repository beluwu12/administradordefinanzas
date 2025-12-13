/**
 * Updated Main Server Entry Point
 * With Helmet security headers, global error handling, and rate limiting
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./db');

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

// CORS: Allow cross-origin requests
app.use(cors());

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

app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/insight', require('./routes/insight'));
app.use('/api/goals', require('./routes/goals'));
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
  console.log('[CRON] Running scheduled BCV rate update...');
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
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
