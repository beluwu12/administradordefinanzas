/**
 * Pagination Utility
 * Reusable pagination helper for Prisma queries
 */

const prisma = require('../db');

/**
 * Paginate a Prisma query with metadata
 * @param {object} model - Prisma model (e.g., prisma.transaction)
 * @param {object} where - Where clause
 * @param {object} options - Pagination options
 * @returns {Promise<{data: any[], pagination: object}>}
 */
const paginate = async (model, where = {}, options = {}) => {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
    const skip = (page - 1) * limit;

    // Build query options
    const queryOptions = {
        where,
        skip,
        take: limit
    };

    // Add optional includes
    if (options.include) {
        queryOptions.include = options.include;
    }

    // Add optional select
    if (options.select) {
        queryOptions.select = options.select;
    }

    // Add order by (default: createdAt desc)
    queryOptions.orderBy = options.orderBy || { createdAt: 'desc' };

    // Execute both queries in parallel
    const [data, total] = await Promise.all([
        model.findMany(queryOptions),
        model.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

/**
 * Add soft delete filter to where clause
 * @param {object} where - Original where clause
 * @returns {object} - Where clause with deletedAt: null
 */
const withSoftDelete = (where = {}) => {
    return {
        ...where,
        deletedAt: null
    };
};

/**
 * Perform soft delete on a record
 * @param {object} model - Prisma model
 * @param {string} id - Record ID
 */
const softDelete = async (model, id) => {
    return model.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
};

module.exports = {
    paginate,
    withSoftDelete,
    softDelete
};
