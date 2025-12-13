const express = require('express');
const router = express.Router();
const prisma = require('../db');
const webpush = require('web-push');
const z = require('zod');

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Validation schemas
const subscribeSchema = z.object({
    endpoint: z.string(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string()
    })
});

// GET /api/notifications - List user notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']; // Middleware should set this, but using header for now if not authenticated properly yet
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
        const userId = req.headers['x-user-id'];
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

// POST /api/notifications/subscribe - Subscribe to push
router.post('/subscribe', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const validation = subscribeSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors });
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
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
