/**
 * Zod Validation Schemas
 * Centralized input validation for all API endpoints
 * 
 * CLEANED: Removed deprecated PIN auth schemas (YAGNI)
 * IMPROVED: Uses constants for magic numbers
 */

const { z } = require('zod');
const { VALIDATION, PAGINATION, CURRENCIES, COUNTRIES } = require('../config/constants');

// ═══════════════════════════════════════════════════════════════
// COMMON VALIDATIONS
// ═══════════════════════════════════════════════════════════════

const uuid = z.string().uuid('ID debe ser un UUID válido');
const positiveNumber = z.number().positive('Debe ser un número positivo');

// Multi-currency support (from constants)
const currency = z.enum(CURRENCIES.SUPPORTED, {
    message: `Moneda debe ser ${CURRENCIES.SUPPORTED.join(', ')}`
});

const transactionType = z.enum(['INCOME', 'EXPENSE'], {
    message: 'Tipo debe ser INCOME o EXPENSE'
});

// Country enum (from constants)
const country = z.enum(COUNTRIES.SUPPORTED, {
    message: `País debe ser ${COUNTRIES.SUPPORTED.join(', ')}`
});

// Timezone validation (IANA format)
const timezone = z.string().min(1).max(50).default('America/Caracas');

// ═══════════════════════════════════════════════════════════════
// AUTH SCHEMAS (Email/Password only - PIN auth removed)
// ═══════════════════════════════════════════════════════════════

const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(VALIDATION.PASSWORD_MIN_LENGTH,
        `Contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`
    ),
    firstName: z.string()
        .min(1, 'Nombre es requerido')
        .max(VALIDATION.NAME_MAX_LENGTH, 'Nombre muy largo'),
    lastName: z.string()
        .min(1, 'Apellido es requerido')
        .max(VALIDATION.NAME_MAX_LENGTH, 'Apellido muy largo'),
    country: country.optional().default(COUNTRIES.DEFAULT)
});

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña es requerida')
});

// ═══════════════════════════════════════════════════════════════
// TRANSACTION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createTransactionSchema = z.object({
    amount: z.union([z.number(), z.string()])
        .transform(val => parseFloat(val))
        .pipe(positiveNumber),
    currency: currency,
    type: transactionType,
    description: z.string()
        .min(1, 'Descripción es requerida')
        .max(VALIDATION.DESCRIPTION_MAX_LENGTH, 'Descripción muy larga'),
    source: z.string().max(100).optional().nullable(),
    date: z.string().datetime().optional()
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional()),
    exchangeRate: z.union([z.number(), z.string()])
        .transform(val => val ? parseFloat(val) : null)
        .optional().nullable(),
    tags: z.array(uuid).optional().default([])
});

const updateTransactionSchema = createTransactionSchema.partial();

// ═══════════════════════════════════════════════════════════════
// TAG SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createTagSchema = z.object({
    name: z.string()
        .min(1, 'Nombre es requerido')
        .max(VALIDATION.TAG_NAME_MAX_LENGTH, 'Nombre muy largo'),
    color: z.string().max(20).optional().default('blue')
});

// ═══════════════════════════════════════════════════════════════
// FIXED EXPENSE SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createFixedExpenseSchema = z.object({
    description: z.string()
        .min(1, 'Descripción es requerida')
        .max(VALIDATION.DESCRIPTION_MAX_LENGTH),
    amount: z.union([z.number(), z.string()])
        .transform(val => parseFloat(val))
        .pipe(positiveNumber),
    currency: currency.optional().default(CURRENCIES.DEFAULT),
    dueDay: z.union([z.number(), z.string()])
        .transform(val => parseInt(val))
        .pipe(z.number().int().min(1, 'Día debe ser entre 1 y 31').max(31, 'Día debe ser entre 1 y 31')),
    startDate: z.string().optional()
});

// ═══════════════════════════════════════════════════════════════
// GOAL SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createGoalSchema = z.object({
    title: z.string().min(1, 'Título es requerido').max(100),
    description: z.string()
        .max(VALIDATION.GOAL_DESCRIPTION_MAX_LENGTH)
        .optional().nullable(),
    totalCost: z.union([z.number(), z.string()])
        .transform(val => parseFloat(val))
        .pipe(positiveNumber),
    monthlyAmount: z.union([z.number(), z.string()])
        .transform(val => parseFloat(val))
        .pipe(positiveNumber),
    currency: currency.optional().default(CURRENCIES.DEFAULT),
    startDate: z.string().optional(),
    tag: z.string().max(VALIDATION.TAG_NAME_MAX_LENGTH).optional().nullable()
}).refine(data => data.monthlyAmount <= data.totalCost, {
    message: 'El ahorro mensual no puede ser mayor que el costo total',
    path: ['monthlyAmount']
});

const toggleMonthSchema = z.object({
    monthId: uuid,
    period: z.enum(['q1', 'q2'], { message: "Period debe ser 'q1' o 'q2'" }),
    isPaid: z.boolean({ message: 'isPaid debe ser un booleano' })
});

// ═══════════════════════════════════════════════════════════════
// PARAM SCHEMAS (for req.params validation)
// ═══════════════════════════════════════════════════════════════

const idParamSchema = z.object({
    id: uuid
});

const goalIdParamSchema = z.object({
    goalId: uuid
});

// ═══════════════════════════════════════════════════════════════
// PAGINATION & QUERY SCHEMAS (using constants)
// ═══════════════════════════════════════════════════════════════

const paginationQuerySchema = z.object({
    page: z.string()
        .transform(val => Math.max(1, parseInt(val) || 1))
        .default('1'),
    limit: z.string()
        .transform(val => Math.min(
            PAGINATION.MAX_PAGE_SIZE,
            Math.max(PAGINATION.MIN_PAGE_SIZE, parseInt(val) || PAGINATION.DEFAULT_PAGE_SIZE)
        ))
        .default(String(PAGINATION.DEFAULT_PAGE_SIZE)),
    type: transactionType.optional(),
    search: z.string().max(VALIDATION.SEARCH_MAX_LENGTH).optional()
});

// ═══════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a validation middleware for the specified schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'params' | 'query'} source - Request property to validate
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req[source]);
            req[source] = result; // Replace with parsed/transformed values
            next();
        } catch (error) {
            // Let global error handler process ZodError
            next(error);
        }
    };
};

module.exports = {
    // Auth (PIN schemas removed - YAGNI)
    registerSchema,
    loginSchema,

    // Transaction
    createTransactionSchema,
    updateTransactionSchema,

    // Tag
    createTagSchema,

    // Fixed Expense
    createFixedExpenseSchema,

    // Goal
    createGoalSchema,
    toggleMonthSchema,

    // Params & Queries
    idParamSchema,
    goalIdParamSchema,
    paginationQuerySchema,

    // Common
    country,
    currency,
    timezone,

    // Middleware
    validate
};
