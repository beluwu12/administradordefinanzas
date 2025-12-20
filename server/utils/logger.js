/**
 * Winston Logger Configuration
 * Structured logging with daily rotation and console output
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');

// Custom format for console (colorized and readable)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
    })
);

// JSON format for file logs (structured, searchable)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Daily rotate transport for combined logs
const combinedTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep 14 days of logs
    format: fileFormat
});

// Daily rotate transport for error logs only
const errorTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d', // Keep 30 days of error logs
    level: 'error',
    format: fileFormat
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    defaultMeta: { service: 'finanzas-backend' },
    transports: [
        combinedTransport,
        errorTransport
    ]
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
} else {
    // In production, still show errors and warnings in console
    logger.add(new winston.transports.Console({
        level: 'warn',
        format: consoleFormat
    }));
}

// Helper methods for common logging patterns
const logRequest = (req, message, meta = {}) => {
    logger.info(message, {
        ...meta,
        userId: req.userId || req.user?.id || 'anonymous',
        method: req.method,
        path: req.path,
        ip: req.ip
    });
};

const logError = (error, req = null, context = {}) => {
    const logData = {
        ...context,
        error: error.message,
        stack: error.stack
    };

    if (req) {
        logData.userId = req.userId || req.user?.id || 'anonymous';
        logData.method = req.method;
        logData.path = req.path;
        logData.ip = req.ip;
    }

    logger.error(error.message, logData);
};

const logAudit = (action, userId, details = {}) => {
    logger.info(`AUDIT: ${action}`, {
        audit: true,
        action,
        userId,
        ...details,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    logger,
    logRequest,
    logError,
    logAudit
};
