const prisma = require('../db');

const requireUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];

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
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: 'Error de servidor en autenticación' });
    }
};

module.exports = requireUser;
