/**
 * Tag Routes - Category Management
 * Updated with new auth middleware, validation, and standardized responses
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireAuth, verifyOwnership } = require('../middleware/requireAuth');
const { success, errors } = require('../utils/responseUtils');
const { createTagSchema, idParamSchema, validate } = require('../schemas');

// All tag routes require authentication
router.use(requireAuth);

/**
 * GET /api/tags - List all tags for authenticated user
 */
router.get('/', async (req, res, next) => {
    try {
        const tags = await prisma.tag.findMany({
            where: { userId: req.userId },
            include: {
                transactions: {
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(success(tags));
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/tags - Create new tag
 * Validates: name, color (optional)
 */
router.post('/', validate(createTagSchema), async (req, res, next) => {
    try {
        const { name, color } = req.body;

        const tag = await prisma.tag.create({
            data: {
                name: name.trim(),
                color: color || 'blue',
                userId: req.userId
            }
        });

        res.status(201).json(success(tag, 'Etiqueta creada'));
    } catch (error) {
        // Prisma P2002 will be caught by global handler as duplicate
        next(error);
    }
});

/**
 * DELETE /api/tags/:id - Delete a tag
 * Validates: id param is UUID
 * Checks ownership before deletion
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check ownership
            const tag = await prisma.tag.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!tag) {
                const errResponse = errors.notFound('Etiqueta');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(tag.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            await prisma.tag.delete({ where: { id } });
            res.json(success({ id }, 'Etiqueta eliminada'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/tags/:id/transactions - Get transactions for a specific tag
 * Validates: id param is UUID
 * Checks ownership before returning
 */
router.get('/:id/transactions',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check tag ownership
            const tag = await prisma.tag.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!tag) {
                const errResponse = errors.notFound('Etiqueta');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(tag.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            // Get transactions with this tag
            const transactions = await prisma.transaction.findMany({
                where: {
                    userId: req.userId,
                    tags: {
                        some: { id: id }
                    }
                },
                include: {
                    tags: {
                        select: { id: true, name: true, color: true }
                    }
                },
                orderBy: { date: 'desc' }
            });

            res.json(success(transactions));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
