const express = require('express');
const router = express.Router();
const prisma = require('../db');
const webpush = require('web-push');
const z = require('zod');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/requireAuth');

// Apply requireAuth to ALL routes in this file
router.use(requireAuth);

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Rate limiting for subscription endpoint (prevent spam)
const subscribeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 subscriptions per 15 min
    message: { success: false, error: 'Too many subscription attempts. Try again later.' }
});

// Validation schemas with stricter endpoint validation
const subscribeSchema = z.object({
    endpoint: z.string().url().refine(url => url.startsWith('https://'), {
        message: 'Endpoint must use HTTPS'
    }),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1)
    })
});

// GET /api/notifications - List user notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.userId; // From requireAuth middleware

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/notifications/subscribe - Subscribe to push (with rate limiting)
router.post('/subscribe', subscribeLimiter, async (req, res) => {
    try {
        const userId = req.userId;

        const validation = subscribeSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription data',
                details: validation.error.errors
            });
        }

        const { endpoint, keys } = validation.data;

        await prisma.pushSubscription.upsert({
            where: {
                endpoint_userId: {
                    endpoint,
                    userId
                }
            },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth
            },
            create: {
                userId,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            }
        });

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// TEST ENDPOINT: Send push to self
router.post('/test', async (req, res) => {
    const userId = req.userId;

    try {
        // Create notification in DB
        const notification = await prisma.notification.create({
            data: {
                userId,
                title: 'Test Notification',
                body: 'Funciona! 🎉 Has recibido una notificación de prueba.',
                type: 'system'
            }
        });

        // Send push to all user subscriptions
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: '/'
        });

        subscriptions.forEach(sub => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: { auth: sub.auth, p256dh: sub.p256dh }
            };
            webpush.sendNotification(pushConfig, payload).catch(err => {
                console.error('Push failed', err);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired, delete it
                    prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
                }
            });
        });

        res.json({ success: true, message: 'Notification sent' });
    } catch (error) {
        console.error('Test push error:', error);
        res.status(500).json({ error: 'Failed to send test push' });
    }
});

module.exports = router;

