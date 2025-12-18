/**
 * Zod Validation Schemas
 * Centralized input validation for all API endpoints
 */

const { z } = require('zod');

// ═══════════════════════════════════════════════════════════════
// COMMON VALIDATIONS
// ═══════════════════════════════════════════════════════════════

const uuid = z.string().uuid('ID debe ser un UUID válido');
const positiveNumber = z.number().positive('Debe ser un número positivo');

// Multi-currency support
const currency = z.enum(['USD', 'VES', 'COP', 'CLP', 'MXN', 'ARS'], {
    message: 'Moneda debe ser USD, VES, COP, CLP, MXN o ARS'
});

const transactionType = z.enum(['INCOME', 'EXPENSE'], {
    message: 'Tipo debe ser INCOME o EXPENSE'
});

// Country enum
const country = z.enum(['VE', 'CO', 'CL', 'MX', 'AR', 'US'], {
    message: 'País debe ser VE, CO, CL, MX, AR o US'
});

// Timezone validation (IANA format)
const timezone = z.string().min(1).max(50).default('America/Caracas');

// ═══════════════════════════════════════════════════════════════
// USER SCHEMAS
// ═══════════════════════════════════════════════════════════════

// Legacy PIN-based auth (deprecated but maintained for compatibility)
const createUserSchema = z.object({
    firstName: z.string().min(1, 'Nombre es requerido').max(50, 'Nombre muy largo'),
    lastName: z.string().min(1, 'Apellido es requerido').max(50, 'Apellido muy largo'),
    pin: z.string().length(4, 'PIN debe ser de 4 dígitos').regex(/^\d{4}$/, 'PIN debe ser numérico')
});

const verifyPinSchema = z.object({
    userId: uuid,
    pin: z.string().length(4, 'PIN debe ser de 4 dígitos')
});

// Email/password auth with multi-country support
const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    firstName: z.string().min(1, 'Nombre es requerido').max(50, 'Nombre muy largo'),
    lastName: z.string().min(1, 'Apellido es requerido').max(50, 'Apellido muy largo'),
    country: country.optional().default('VE')
});

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña es requerida')
});

// ═══════════════════════════════════════════════════════════════
// TRANSACTION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createTransactionSchema = z.object({
    amount: z.union([z.number(), z.string()]).transform(val => parseFloat(val)).pipe(positiveNumber),
    currency: currency,
    type: transactionType,
    description: z.string().min(1, 'Descripción es requerida').max(200, 'Descripción muy larga'),
    source: z.string().max(100).optional().nullable(),
    date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional()),
    exchangeRate: z.union([z.number(), z.string()]).transform(val => val ? parseFloat(val) : null).optional().nullable(),
    tags: z.array(uuid).optional().default([])
});

const updateTransactionSchema = createTransactionSchema.partial();

// ═══════════════════════════════════════════════════════════════
// TAG SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createTagSchema = z.object({
    name: z.string().min(1, 'Nombre es requerido').max(50, 'Nombre muy largo'),
    color: z.string().max(20).optional().default('blue')
});

// ═══════════════════════════════════════════════════════════════
// FIXED EXPENSE SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createFixedExpenseSchema = z.object({
    description: z.string().min(1, 'Descripción es requerida').max(200),
    amount: z.union([z.number(), z.string()]).transform(val => parseFloat(val)).pipe(positiveNumber),
    currency: currency.optional().default('USD'),
    dueDay: z.union([z.number(), z.string()]).transform(val => parseInt(val)).pipe(
        z.number().int().min(1, 'Día debe ser entre 1 y 31').max(31, 'Día debe ser entre 1 y 31')
    ),
    startDate: z.string().optional()
});

// ═══════════════════════════════════════════════════════════════
// GOAL SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createGoalSchema = z.object({
    title: z.string().min(1, 'Título es requerido').max(100),
    description: z.string().max(500).optional().nullable(),
    totalCost: z.union([z.number(), z.string()]).transform(val => parseFloat(val)).pipe(positiveNumber),
    monthlyAmount: z.union([z.number(), z.string()]).transform(val => parseFloat(val)).pipe(positiveNumber),
    currency: currency.optional().default('USD'),
    startDate: z.string().optional(),
    tag: z.string().max(50).optional().nullable()
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
// PAGINATION & QUERY SCHEMAS
// ═══════════════════════════════════════════════════════════════

const paginationQuerySchema = z.object({
    page: z.string().transform(val => Math.max(1, parseInt(val) || 1)).default('1'),
    limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 20))).default('20'),
    type: transactionType.optional(),
    search: z.string().max(100).optional()
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
    // User
    createUserSchema,
    verifyPinSchema,
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

