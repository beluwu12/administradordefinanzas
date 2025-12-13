const cron = require('node-cron');
const prisma = require('../db');
const webpush = require('web-push');

const sendPushToUser = async (userId, title, body, link = '/') => {
    try {
        // Create DB notification
        await prisma.notification.create({
            data: { userId, title, body, type: 'system', link }
        });

        // Fetch subscriptions
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        const payload = JSON.stringify({ title, body, url: link });

        // Send to all devices
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { auth: sub.auth, p256dh: sub.p256dh }
                }, payload);
            } catch (error) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                }
            }
        }
    } catch (error) {
        console.error(`Failed to send push to user ${userId}:`, error);
    }
};

const initCronJobs = () => {
    console.log('📅 Initializing Cron Jobs...');

    // 1. Quincena Reminder (1st and 15th at 08:00 AM)
    // "0 8 1,15 * *"
    cron.schedule('0 8 1,15 * *', async () => {
        console.log('Running Quincena Reminder Job');
        const users = await prisma.user.findMany({ include: { goals: true } });

        for (const user of users) {
            const monthlyGoal = user.goals.find(g => g.title === "Meta Mensual" || g.description?.includes("mensual"));
            let message = "¡Hoy es día de quincena! Recuerda registrar tus ingresos y ahorros.";

            if (monthlyGoal) {
                message += ` Tu meta mensual es ${monthlyGoal.totalCost} USD.`;
            }

            await sendPushToUser(user.id, "💰 ¡Llegó la Quincena!", message, "/transactions");
        }
    });

    // 2. Goal Warning (Daily at 20:00 PM) - Check if < 50% of expected progress
    // "0 20 * * *"
    cron.schedule('0 20 * * *', async () => {
        console.log('Running Goal Warning Job');
        // Logic: Checks active monthly goals. If halfway through month and < 50% saved?
        // Simplified for "User Request": "Si meta quincenal < 50% a las 20:00" -> Assuming this means checking a 'Quincenal' goal specifically on specific days or daily?
        // User requested: "Si meta quincenal < 50% a las 20:00 -> 'Faltan X USD para tu meta quincenal'"

        // We'll check daily for goals tagged "Quincenal"
        const users = await prisma.user.findMany({
            include: {
                goals: {
                    where: { title: { contains: 'Quincenal' } }
                }
            }
        });

        for (const user of users) {
            for (const goal of user.goals) {
                const progress = (goal.savedAmount / goal.totalCost) * 100;
                if (progress < 50) {
                    const missing = goal.totalCost - goal.savedAmount;
                    await sendPushToUser(
                        user.id,
                        "⚠️ Alerta de Meta Quincenal",
                        `Estás al ${progress.toFixed(1)}%. Faltan ${missing.toFixed(2)} ${goal.currency} para tu meta.`,
                        "/goals"
                    );
                }
            }
        }
    });
};

module.exports = { initCronJobs };
