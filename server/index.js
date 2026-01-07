/**
 * Main Server Entry Point
 * Production-ready with:
 * - Environment-based CORS configuration
 * - Helmet security headers
 * - Global error handling
 * - Rate limiting
 * - Winston logging
 * - Graceful shutdown
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const prisma = require('./db');
const { logger } = require('./utils/logger');
const { RATE_LIMITS } = require('./config/constants');

// Middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRIMARY_INSTANCE = process.env.INSTANCE_ID === '1' || process.env.INSTANCE_ID === undefined;

// Trust first proxy (Azure Container Apps, nginx, etc.)
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ═══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

const isProduction = NODE_ENV === 'production';

// Block access to sensitive files FIRST (before any other middleware)
app.use((req, res, next) => {
  const blockedPaths = [
    '/.env', '/.git', '/.gitignore', '/.DS_Store',
    '/package.json', '/package-lock.json', '/yarn.lock',
    '/.npmrc', '/tsconfig.json', '/vite.config.js',
    '/prisma', '/node_modules'
  ];

  const path = req.path.toLowerCase();
  if (blockedPaths.some(blocked => path.startsWith(blocked))) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  next();
});

// Helmet: Set various HTTP headers for security
app.use(helmet({
  // Content Security Policy - API server allows JSON responses
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"]
    }
  } : false,

  // Strict Transport Security (HSTS) - force HTTPS
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Prevent clickjacking
  frameguard: { action: 'deny' },

  // Prevent MIME type sniffing
  noSniff: true,

  // Referrer policy
  referrerPolicy: { policy: 'no-referrer' },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Permissions Policy
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Disable for API
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));

// Additional security headers not covered by helmet
app.use((req, res, next) => {
  // Permissions-Policy (Feature-Policy successor)
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  next();
});

// CORS: Configuration from environment variables
const getAllowedOrigins = () => {
  // Get origins from environment variable (comma-separated)
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }

  // Fallback for development
  if (NODE_ENV === 'development') {
    return [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:4173',  // Vite preview
      'http://localhost',       // Docker nginx
      'http://localhost:80',
      'http://127.0.0.1',
      'http://127.0.0.1:5173'
    ];
  }

  // Production requires explicit CORS_ALLOWED_ORIGINS
  logger.warn('No CORS_ALLOWED_ORIGINS set in production! Using empty list.');
  return [];
};

const allowedOrigins = getAllowedOrigins();
const ALLOW_NO_ORIGIN = process.env.FEATURE_ALLOW_NO_ORIGIN === 'true';
logger.info('CORS allowed origins', { origins: allowedOrigins, env: NODE_ENV, allowNoOrigin: ALLOW_NO_ORIGIN });

app.use(cors({
  origin: (origin, callback) => {
    // Requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      // In production, block no-origin unless explicitly allowed
      if (ALLOW_NO_ORIGIN || NODE_ENV === 'development') {
        return callback(null, true);
      }
      logger.warn('CORS blocked request with no origin');
      return callback(new Error('Origin required'));
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Cookie parser (for refresh tokens)
app.use(cookieParser());

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH_WINDOW_MS,
  max: RATE_LIMITS.AUTH_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Demasiados intentos, intenta de nuevo en 15 minutos',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to authentication endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
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
const authRoutes = require('./routes/auth');
const { initCronJobs } = require('./cron/reminderJobs');

// Enable Cron Jobs only on primary instance (prevents duplicates in scaled environments)
const cronEnabled = process.env.CRON_ENABLED === 'true';
if (cronEnabled && IS_PRIMARY_INSTANCE) {
  logger.info('Initializing cron jobs (primary instance)');
  initCronJobs();
} else if (cronEnabled && !IS_PRIMARY_INSTANCE) {
  logger.info('Skipping cron jobs (not primary instance)', { instanceId: process.env.INSTANCE_ID });
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/insight', insightRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/exchange-rate', require('./routes/exchangeRate'));

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK (enhanced with readiness/liveness probes)
// ═══════════════════════════════════════════════════════════════

const healthRoutes = require('./routes/health');
app.use('/health', healthRoutes);

// Legacy /api/health endpoint for backwards compatibility
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      message: 'Personal Finance API is running',
      timestamp: new Date().toISOString(),
      version: '2.2.0',  // Version bump for Google-quality refactor
      environment: NODE_ENV
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SCHEDULED TASKS (only on primary instance)
// ═══════════════════════════════════════════════════════════════

const cron = require('node-cron');
const { updateExchangeRate } = require('./services/bcvScraper');

if (IS_PRIMARY_INSTANCE) {
  // Schedule: At minute 0 past hour 8, 16, and 0 (Venezuela time)
  cron.schedule('0 8,16,0 * * *', async () => {
    logger.info('Running scheduled BCV rate update', { job: 'bcv-rate' });
    await updateExchangeRate();
  }, {
    timezone: 'America/Caracas'
  });

  // Run once on startup (non-blocking)
  updateExchangeRate().catch(err => {
    logger.error('Initial exchange rate update failed', { error: err.message });
  });
}

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

const server = app.listen(PORT, () => {
  logger.info('═══════════════════════════════════════════════════════');
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📡 Environment: ${NODE_ENV}`);
  logger.info(`🔒 CORS origins: ${allowedOrigins.length} configured`);
  logger.info(`⏰ Cron jobs: ${cronEnabled && IS_PRIMARY_INSTANCE ? 'ENABLED' : 'DISABLED'}`);
  logger.info('═══════════════════════════════════════════════════════');
});

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
