/**
 * NotificationService - Local notifications for reminders
 * 
 * Handles:
 * - Budget alerts (80%, 100% threshold)
 * - Weekly goal reminders
 * - Fixed expense due date reminders (3 days before)
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const NOTIFICATION_CHANNELS = {
    BUDGET: 'budget-alerts',
    GOALS: 'goal-reminders',
    FIXED_EXPENSES: 'expense-reminders'
};

class NotificationService {
    isInitialized = false;
    hasPermission = false;

    /**
     * Initialize notifications and request permission
     */
    async initialize() {
        if (!Capacitor.isNativePlatform()) {
            console.log('[NotificationService] Skipping - not native platform');
            return;
        }

        if (this.isInitialized) return;

        try {
            // Request permission
            const permResult = await LocalNotifications.requestPermissions();
            this.hasPermission = permResult.display === 'granted';

            if (!this.hasPermission) {
                console.warn('[NotificationService] Permission not granted');
                return;
            }

            // Create notification channels (Android)
            if (Capacitor.getPlatform() === 'android') {
                await this.createChannels();
            }

            // Register notification action listeners
            await LocalNotifications.addListener('localNotificationReceived', (notification) => {
                console.log('[NotificationService] Received:', notification);
            });

            await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
                console.log('[NotificationService] Action:', action);
                // Handle navigation based on notification type
                this.handleNotificationAction(action);
            });

            this.isInitialized = true;
            console.log('[NotificationService] Initialized');
        } catch (error) {
            console.error('[NotificationService] Init error:', error);
        }
    }

    /**
     * Create Android notification channels
     */
    async createChannels() {
        await LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNELS.BUDGET,
            name: 'Alertas de Presupuesto',
            description: 'Notificaciones cuando el gasto se acerca o supera el presupuesto',
            importance: 4, // HIGH
            visibility: 1,
            sound: 'default',
            vibration: true
        });

        await LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNELS.GOALS,
            name: 'Recordatorios de Metas',
            description: 'Recordatorios semanales sobre tus metas de ahorro',
            importance: 3, // DEFAULT
            visibility: 1,
            sound: 'default'
        });

        await LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNELS.FIXED_EXPENSES,
            name: 'Gastos Fijos',
            description: 'Recordatorios de pagos próximos',
            importance: 4, // HIGH
            visibility: 1,
            sound: 'default',
            vibration: true
        });
    }

    // ============================================
    // BUDGET ALERTS
    // ============================================

    /**
     * Check budget and show alert if threshold exceeded
     * @param {object} budget - { category, limit, spent, currency }
     */
    async checkBudgetThreshold(budget) {
        if (!this.hasPermission) return;

        const percentage = (budget.spent / budget.limit) * 100;

        if (percentage >= 100) {
            await this.showBudgetExceeded(budget);
        } else if (percentage >= 80) {
            await this.showBudgetWarning(budget, percentage);
        }
    }

    async showBudgetWarning(budget, percentage) {
        const notifId = this.generateId('budget-warn');

        await LocalNotifications.schedule({
            notifications: [{
                id: notifId,
                title: '⚠️ Alerta de Presupuesto',
                body: `Has gastado el ${Math.round(percentage)}% de tu presupuesto de ${budget.category}`,
                channelId: NOTIFICATION_CHANNELS.BUDGET,
                schedule: { at: new Date() },
                extra: {
                    type: 'budget_warning',
                    category: budget.category
                }
            }]
        });
    }

    async showBudgetExceeded(budget) {
        const notifId = this.generateId('budget-exceed');

        await LocalNotifications.schedule({
            notifications: [{
                id: notifId,
                title: '🚨 Presupuesto Excedido',
                body: `Has superado tu presupuesto de ${budget.category}. Gastado: ${budget.currency} ${budget.spent.toFixed(2)}`,
                channelId: NOTIFICATION_CHANNELS.BUDGET,
                schedule: { at: new Date() },
                extra: {
                    type: 'budget_exceeded',
                    category: budget.category
                }
            }]
        });
    }

    // ============================================
    // GOAL REMINDERS (Weekly)
    // ============================================

    /**
     * Schedule weekly goal reminders
     * @param {array} goals - Array of active goals
     */
    async scheduleWeeklyGoalReminders(goals) {
        if (!this.hasPermission || !goals.length) return;

        // Cancel existing goal reminders first
        await this.cancelGoalReminders();

        // Schedule for next Sunday at 10:00 AM
        const nextSunday = this.getNextSunday();
        nextSunday.setHours(10, 0, 0, 0);

        for (const goal of goals) {
            const notifId = this.generateId(`goal-${goal.id}`);
            const remaining = goal.totalCost - goal.savedAmount;

            await LocalNotifications.schedule({
                notifications: [{
                    id: notifId,
                    title: '💰 Recordatorio de Meta',
                    body: `Recuerda ahorrar para "${goal.title}". Faltan ${goal.currency || 'USD'} ${remaining.toFixed(2)}`,
                    channelId: NOTIFICATION_CHANNELS.GOALS,
                    schedule: {
                        at: nextSunday,
                        every: 'week',
                        allowWhileIdle: true
                    },
                    extra: {
                        type: 'goal_reminder',
                        goalId: goal.id
                    }
                }]
            });
        }

        // Store scheduled goal IDs
        await Preferences.set({
            key: 'scheduled_goal_reminders',
            value: JSON.stringify(goals.map(g => g.id))
        });

        console.log(`[NotificationService] Scheduled ${goals.length} weekly goal reminders`);
    }

    async cancelGoalReminders() {
        try {
            const { value } = await Preferences.get({ key: 'scheduled_goal_reminders' });
            if (value) {
                const goalIds = JSON.parse(value);
                for (const goalId of goalIds) {
                    const notifId = this.generateId(`goal-${goalId}`);
                    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
                }
            }
        } catch (e) {
            console.warn('[NotificationService] Error canceling goal reminders:', e);
        }
    }

    /**
     * Notify about goal deadline approaching
     * @param {object} goal - Goal with deadline
     */
    async notifyGoalDeadline(goal) {
        if (!this.hasPermission) return;

        const deadline = new Date(goal.deadline);
        const now = new Date();
        const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 7 && daysRemaining > 0) {
            const notifId = this.generateId(`goal-deadline-${goal.id}`);

            await LocalNotifications.schedule({
                notifications: [{
                    id: notifId,
                    title: '📅 Meta Próxima a Vencer',
                    body: `Tu meta "${goal.title}" vence en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''}`,
                    channelId: NOTIFICATION_CHANNELS.GOALS,
                    schedule: { at: new Date() },
                    extra: {
                        type: 'goal_deadline',
                        goalId: goal.id
                    }
                }]
            });
        }
    }

    // ============================================
    // FIXED EXPENSE REMINDERS
    // ============================================

    /**
     * Schedule reminders for fixed expenses (3 days before due date)
     * @param {array} expenses - Array of active fixed expenses
     */
    async scheduleFixedExpenseReminders(expenses) {
        if (!this.hasPermission || !expenses.length) return;

        // Cancel existing expense reminders
        await this.cancelFixedExpenseReminders();

        const now = new Date();
        const currentDay = now.getDate();

        for (const expense of expenses) {
            if (!expense.isActive) continue;

            // Calculate next occurrence
            let reminderDate = new Date();

            if (expense.dueDay > currentDay) {
                // This month
                reminderDate.setDate(expense.dueDay - 3);
            } else {
                // Next month
                reminderDate.setMonth(reminderDate.getMonth() + 1);
                reminderDate.setDate(expense.dueDay - 3);
            }

            // If reminder date is in the past, skip
            if (reminderDate < now) {
                reminderDate.setMonth(reminderDate.getMonth() + 1);
            }

            reminderDate.setHours(9, 0, 0, 0); // 9 AM

            const notifId = this.generateId(`expense-${expense.id}`);

            await LocalNotifications.schedule({
                notifications: [{
                    id: notifId,
                    title: '📋 Pago Próximo',
                    body: `"${expense.description}" vence el día ${expense.dueDay}. Monto: ${expense.currency || 'USD'} ${expense.amount.toFixed(2)}`,
                    channelId: NOTIFICATION_CHANNELS.FIXED_EXPENSES,
                    schedule: {
                        at: reminderDate,
                        every: 'month',
                        allowWhileIdle: true
                    },
                    extra: {
                        type: 'fixed_expense',
                        expenseId: expense.id
                    }
                }]
            });
        }

        // Store scheduled expense IDs
        await Preferences.set({
            key: 'scheduled_expense_reminders',
            value: JSON.stringify(expenses.map(e => e.id))
        });

        console.log(`[NotificationService] Scheduled ${expenses.length} fixed expense reminders`);
    }

    async cancelFixedExpenseReminders() {
        try {
            const { value } = await Preferences.get({ key: 'scheduled_expense_reminders' });
            if (value) {
                const expenseIds = JSON.parse(value);
                for (const expenseId of expenseIds) {
                    const notifId = this.generateId(`expense-${expenseId}`);
                    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
                }
            }
        } catch (e) {
            console.warn('[NotificationService] Error canceling expense reminders:', e);
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Handle notification action (e.g., taps)
     */
    handleNotificationAction(action) {
        const extra = action.notification?.extra;
        if (!extra) return;

        // You can dispatch navigation events here
        // For now, just log
        console.log('[NotificationService] Action type:', extra.type);
    }

    /**
     * Generate a numeric notification ID from a string
     */
    generateId(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Get next Sunday date
     */
    getNextSunday() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + daysUntilSunday);
        return nextSunday;
    }

    /**
     * Cancel all notifications
     */
    async cancelAll() {
        await LocalNotifications.cancelAll();
        await Preferences.remove({ key: 'scheduled_goal_reminders' });
        await Preferences.remove({ key: 'scheduled_expense_reminders' });
    }

    /**
     * Get pending notifications
     */
    async getPending() {
        return LocalNotifications.getPending();
    }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;
