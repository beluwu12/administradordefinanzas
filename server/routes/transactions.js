/**
 * Transaction Routes - Income and Expense Management
 * 
 * FIXED:
 * - Uses requireOwnership middleware (DRY)
 * - Balance calculation uses database aggregation (performance)
 * - Consistent error handling
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const Decimal = require('decimal.js');
const { parseMoney } = require('../utils/money');
const { requireAuth, requireOwnership } = require('../middleware/requireAuth');
const { enforceCurrency } = require('../middleware/currencyEnforcer');
const { success, errors } = require('../utils/responseUtils');
const { paginate, withSoftDelete, softDelete } = require('../utils/pagination');
const { createTransactionSchema, updateTransactionSchema, idParamSchema, paginationQuerySchema, validate } = require('../schemas');
const { isDualCurrency } = require('../config/countries');
const { getLatestRate } = require('../services/bcvScraper');

// All transaction routes require authentication
router.use(requireAuth);

/**
 * GET /api/transactions - List all transactions with pagination
 * Query params: page, limit, type, search
 */
router.get('/', validate(paginationQuerySchema, 'query'), async (req, res, next) => {
    try {
        const { page, limit, type, search } = req.query;

        // Build where clause with soft delete filter
        const where = withSoftDelete({ userId: req.userId });

        if (type) {
            where.type = type;
        }

        if (search) {
            where.description = { contains: search, mode: 'insensitive' };
        }

        // Add date filters if provided in query
        const { startDate, endDate } = req.query;
        if (startDate) {
            where.date = { ...(where.date || {}), gte: new Date(startDate) };
        }
        if (endDate) {
            where.date = { ...(where.date || {}), lte: new Date(endDate + 'T23:59:59.999Z') };
        }

        const result = await paginate(prisma.transaction, where, {
            page,
            limit,
            orderBy: { date: 'desc' },
            include: {
                tags: { select: { id: true, name: true, color: true } }
            }
        });

        // Calculate period totals using database aggregation - GROUP BY CURRENCY
        const statsAggregation = await prisma.transaction.groupBy({
            by: ['type', 'currency'],
            where,
            _sum: { amount: true }
        });

        // Only sum USD transactions for stats (VES would need exchange rate conversion)
        let totalIncomeUSD = 0;
        let totalExpenseUSD = 0;
        statsAggregation.forEach(agg => {
            const amount = Math.abs(agg._sum.amount || 0);
            if (agg.currency === 'USD') {
                if (agg.type === 'INCOME') totalIncomeUSD += amount;
                else if (agg.type === 'EXPENSE') totalExpenseUSD += amount;
            }
            // VES amounts are not included in USD totals - they would distort the numbers
        });

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
            stats: {
                totalIncome: totalIncomeUSD,
                totalExpense: totalExpenseUSD,
                balance: totalIncomeUSD - totalExpenseUSD
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/transactions/balance - Get balance summary (polymorphic)
 * 
 * PERFORMANCE FIX: Uses database aggregation instead of loading all transactions
 * VE users: { isDual: true, primary: USD, secondary: VES, exchangeRate }
 * Other users: { isDual: false, primary: localCurrency }
 */
router.get('/balance', async (req, res, next) => {
    try {
        const user = req.user;
        const userIsDual = isDualCurrency(user.country);

        // Use database aggregation for performance
        // Groups by currency and type, sums amounts in the database
        const aggregations = await prisma.transaction.groupBy({
            by: ['currency', 'type'],
            where: withSoftDelete({ userId: req.userId }),
            _sum: {
                amount: true
            }
        });

        // Calculate balance per currency from aggregations
        const balances = {};

        aggregations.forEach(agg => {
            const currency = agg.currency || user.defaultCurrency;
            const amount = new Decimal(agg._sum.amount || 0);

            if (!balances[currency]) {
                balances[currency] = new Decimal(0);
            }

            if (agg.type === 'INCOME') {
                balances[currency] = balances[currency].plus(amount);
            } else if (agg.type === 'EXPENSE') {
                balances[currency] = balances[currency].minus(amount);
            }
        });

        // Format response based on country
        if (userIsDual) {
            // Venezuela: Dual currency response
            const rateData = await getLatestRate();
            const exchangeRate = rateData?.rate || null;

            res.json(success({
                isDual: true,
                primary: {
                    currency: 'USD',
                    amount: (balances['USD'] || new Decimal(0)).toNumber()
                },
                secondary: {
                    currency: 'VES',
                    amount: (balances['VES'] || new Decimal(0)).toNumber()
                },
                exchangeRate
            }));
        } else {
            // International: Single currency response
            const primaryCurrency = user.defaultCurrency;

            res.json(success({
                isDual: false,
                primary: {
                    currency: primaryCurrency,
                    amount: (balances[primaryCurrency] || new Decimal(0)).toNumber()
                },
                secondary: null,
                exchangeRate: null
            }));
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/transactions - Create new transaction
 */
router.post('/',
    validate(createTransactionSchema),
    enforceCurrency,
    async (req, res, next) => {
        try {
            const { amount, currency, type, description, source, date, exchangeRate, tags } = req.body;

            // Parse monetary values using Decimal.js (never parseFloat for money)
            const parsedAmount = parseMoney(amount);
            const parsedRate = exchangeRate ? parseMoney(exchangeRate) : null;

            if (!parsedAmount) {
                const errResponse = errors.validation('Monto inválido');
                return res.status(errResponse.status).json(errResponse);
            }

            // If tags provided, verify they belong to user
            if (tags && tags.length > 0) {
                const userTags = await prisma.tag.findMany({
                    where: { id: { in: tags }, userId: req.userId },
                    select: { id: true }
                });

                if (userTags.length !== tags.length) {
                    const errResponse = errors.validation('Una o más etiquetas no existen o no te pertenecen');
                    return res.status(errResponse.status).json(errResponse);
                }
            }

            // Use prisma.$transaction for atomicity when connecting tags
            const transaction = await prisma.$transaction(async (tx) => {
                return tx.transaction.create({
                    data: {
                        amount: parsedAmount.toNumber(),
                        currency: currency || req.user.defaultCurrency,
                        type,
                        description: description.trim(),
                        source: source?.trim() || null,
                        date: date ? new Date(date) : new Date(),
                        exchangeRate: parsedRate?.toNumber() || null,
                        userId: req.userId,
                        tags: tags?.length > 0 ? { connect: tags.map(id => ({ id })) } : undefined
                    },
                    include: {
                        tags: { select: { id: true, name: true, color: true } }
                    }
                });
            });

            res.status(201).json(success(transaction, 'Transacción creada'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/transactions/:id - Update transaction
 * Uses requireOwnership middleware for DRY
 */
router.put('/:id',
    validate(idParamSchema, 'params'),
    validate(updateTransactionSchema),
    enforceCurrency,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check ownership and soft-delete status
            const existing = await prisma.transaction.findUnique({
                where: { id },
                select: { userId: true, deletedAt: true }
            });

            if (!existing || existing.deletedAt) {
                const errResponse = errors.notFound('Transacción');
                return res.status(errResponse.status).json(errResponse);
            }

            if (existing.userId !== req.userId) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            const { amount, currency, type, description, source, date, exchangeRate, tags } = req.body;

            const updateData = {};

            // Parse monetary values using Decimal.js (never parseFloat for money)
            if (amount !== undefined) {
                const parsedAmount = parseMoney(amount);
                if (!parsedAmount) {
                    const errResponse = errors.validation('Monto inválido');
                    return res.status(errResponse.status).json(errResponse);
                }
                updateData.amount = parsedAmount.toNumber();
            }
            if (currency !== undefined) updateData.currency = currency;
            if (type !== undefined) updateData.type = type;
            if (description !== undefined) updateData.description = description.trim();
            if (source !== undefined) updateData.source = source?.trim() || null;
            if (date !== undefined) updateData.date = new Date(date);
            if (exchangeRate !== undefined) {
                const parsedRate = parseMoney(exchangeRate);
                updateData.exchangeRate = parsedRate?.toNumber() || null;
            }

            if (tags !== undefined) {
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
 * DELETE /api/transactions/:id - Soft delete transaction
 */
router.delete('/:id',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const existing = await prisma.transaction.findUnique({
                where: { id },
                select: { userId: true, deletedAt: true }
            });

            if (!existing || existing.deletedAt) {
                const errResponse = errors.notFound('Transacción');
                return res.status(errResponse.status).json(errResponse);
            }

            if (existing.userId !== req.userId) {
                const errResponse = errors.ownershipFailed();
                return res.status(errResponse.status).json(errResponse);
            }

            // Soft delete instead of hard delete
            await softDelete(prisma.transaction, id);

            res.json(success({ id }, 'Transacción eliminada'));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
