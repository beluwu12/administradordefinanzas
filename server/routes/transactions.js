/**
 * Transaction Routes - Income and Expense Management
 * Updated with validation, ownership checks, and standardized responses
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const Decimal = require('decimal.js');
const { requireAuth, verifyOwnership } = require('../middleware/requireAuth');
const { success, errors } = require('../utils/responseUtils');
const { createTransactionSchema, updateTransactionSchema, idParamSchema, validate } = require('../schemas');

// All transaction routes require authentication
router.use(requireAuth);

/**
 * GET /api/transactions - List all transactions for user
 * Supports query params: type, limit, offset
 */
router.get('/', async (req, res, next) => {
    try {
        const { type, limit = 50, offset = 0 } = req.query;

        const where = { userId: req.userId };
        if (type && ['INCOME', 'EXPENSE'].includes(type)) {
            where.type = type;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                tags: {
                    select: { id: true, name: true, color: true }
                }
            },
            orderBy: { date: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        res.json(success(transactions));
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/transactions/balance - Get balance summary
 * Returns: { USD: number, VES: number }
 */
router.get('/balance', async (req, res, next) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.userId },
            select: { amount: true, currency: true, type: true }
        });

        // Use decimal.js for precise calculations
        const balance = { USD: new Decimal(0), VES: new Decimal(0) };

        transactions.forEach(tx => {
            const amount = new Decimal(tx.amount);
            const currency = tx.currency || 'USD';

            if (tx.type === 'INCOME') {
                balance[currency] = balance[currency].plus(amount);
            } else if (tx.type === 'EXPENSE') {
                balance[currency] = balance[currency].minus(amount);
            }
        });

        res.json(success({
            USD: balance.USD.toNumber(),
            VES: balance.VES.toNumber()
        }));
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/transactions - Create new transaction
 */
router.post('/', validate(createTransactionSchema), async (req, res, next) => {
    try {
        const { amount, currency, type, description, source, date, exchangeRate, tags } = req.body;

        // If tags provided, verify they belong to user (deep ownership check)
        if (tags && tags.length > 0) {
            const userTags = await prisma.tag.findMany({
                where: {
                    id: { in: tags },
                    userId: req.userId
                },
                select: { id: true }
            });

            if (userTags.length !== tags.length) {
                const errResponse = errors.validation('Una o más etiquetas no existen o no te pertenecen');
                return res.status(errResponse.status).json(errResponse);
            }
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                currency: currency || 'USD',
                type,
                description: description.trim(),
                source: source?.trim() || null,
                date: date ? new Date(date) : new Date(),
                exchangeRate: exchangeRate || null,
                userId: req.userId,
                tags: tags?.length > 0 ? { connect: tags.map(id => ({ id })) } : undefined
            },
            include: {
                tags: { select: { id: true, name: true, color: true } }
            }
        });

        res.status(201).json(success(transaction, 'Transacción creada'));
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/transactions/:id - Update transaction
 */
router.put('/:id',
    validate(idParamSchema, 'params'),
    validate(updateTransactionSchema),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check ownership
            const existing = await prisma.transaction.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!existing) {
                const errResponse = errors.notFound('Transacción');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(existing.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            const { amount, currency, type, description, source, date, exchangeRate, tags } = req.body;

            // Build update data (only include provided fields)
            const updateData = {};
            if (amount !== undefined) updateData.amount = parseFloat(amount);
            if (currency !== undefined) updateData.currency = currency;
            if (type !== undefined) updateData.type = type;
            if (description !== undefined) updateData.description = description.trim();
            if (source !== undefined) updateData.source = source?.trim() || null;
            if (date !== undefined) updateData.date = new Date(date);
            if (exchangeRate !== undefined) updateData.exchangeRate = exchangeRate;

            // Handle tags update
            if (tags !== undefined) {
                // Verify tag ownership
                if (tags.length > 0) {
                    const userTags = await prisma.tag.findMany({
                        where: { id: { in: tags }, userId: req.userId },
                        select: { id: true }
                    });
                    if (userTags.length !== tags.length) {
                        const errResponse = errors.validation('Etiquetas inválidas');
                        return res.status(errResponse.status).json(errResponse);
                    }
                }
                updateData.tags = { set: tags.map(id => ({ id })) };
            }

            const updated = await prisma.transaction.update({
                where: { id },
                data: updateData,
                include: {
                    tags: { select: { id: true, name: true, color: true } }
                }
            });

            res.json(success(updated, 'Transacción actualizada'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/transactions/:id - Delete transaction
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check ownership
            const existing = await prisma.transaction.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!existing) {
                const errResponse = errors.notFound('Transacción');
                return res.status(errResponse.status).json(errResponse);
            }

            if (!verifyOwnership(existing.userId, req.userId)) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            await prisma.transaction.delete({ where: { id } });
            res.json(success({ id }, 'Transacción eliminada'));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
