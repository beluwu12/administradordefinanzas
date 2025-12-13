const prisma = require('../db');
const jwt = require('jsonwebtoken');

const requireUser = async (req, res, next) => {
    // 1. Check for Authorization header (Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        return res.status(401).json({ error: 'Autorización requerida (Usuario no identificado)' });
    }

    try {
        // Verify user exists in DB for security
        const user = await prisma.user.findUnique({ where: { id: userId.trim() } });
        if (!user) {
            return res.status(401).json({ error: 'Usuario no válido' });
        }

        req.userId = userId.trim();
        next();
        return;
    }

    return res.status(401).json({ error: 'Autorización requerida' });
};

module.exports = requireUser;
