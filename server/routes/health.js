/**
 * Health Check Routes
 * 
 * Provides endpoints for monitoring application health and readiness.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { logger } = require('../utils/logger');

/**
 * GET /health - Basic health check
 * Returns 200 if server is running
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * GET /health/ready - Readiness check
 * Verifies database connectivity and returns detailed status
 */
router.get('/ready', async (req, res) => {
    const checks = {
        server: 'healthy',
        database: 'unknown'
    };

    let overallStatus = 200;

    try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;
        checks.database = 'healthy';
    } catch (error) {
        checks.database = 'unhealthy';
        overallStatus = 503;
        logger.error('Database health check failed', { error: error.message });
    }

    res.status(overallStatus).json({
        status: overallStatus === 200 ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /health/live - Liveness check
 * Simple check to verify the process is running
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
