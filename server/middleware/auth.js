const prisma = require('../db');
const jwt = require('jsonwebtoken');

const requireUser = async (req, res, next) => {
    // 1. Check for Authorization header (Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        // Verify JWT
        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Token inválido o expirado' });
            }
            req.userId = decoded.id;
            next();
        });
        return;
    }

    // 2. Legacy Support (Temporary): Check for x-user-id
    // TODO: Remove this after frontend migration is fully confirmed
    const legacyUserId = req.headers['x-user-id'];
    if (legacyUserId) {
        console.warn("Using legacy x-user-id auth");
        req.userId = legacyUserId;
        next();
        return;
    }

    return res.status(401).json({ error: 'Autorización requerida' });
};

module.exports = requireUser;
