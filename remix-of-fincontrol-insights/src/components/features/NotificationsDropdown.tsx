import { Bell, Check, Trash2, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeDate } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { useBudgets, useGoals, useUpcomingBills } from '@/lib/api/hooks';
import { differenceInDays, parseISO, format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
  category: 'budget' | 'bill' | 'goal' | 'general';
}

const NotificationsDropdown = () => {
  const { formatAmount } = useCurrency();
  const { settings, sendPushNotification, playNotificationSound } = useNotificationSettings();
  const sentPushNotifications = useRef<Set<string>>(new Set());
  const playedSoundNotifications = useRef<Set<string>>(new Set());

  // API hooks
  const { data: budgetsData } = useBudgets();
  const { data: goalsData } = useGoals();
  const { data: upcomingBillsData } = useUpcomingBills(7);

  const budgets = budgetsData || [];
  const goals = goalsData || [];
  const upcomingBills = upcomingBillsData || [];

  // Generate dynamic notifications based on API data and settings
  const dynamicNotifications = useMemo(() => {
    const notifications: Notification[] = [];
    const now = new Date();
    const today = now.toISOString();

    // Budget alerts - only if enabled
    if (settings.budgetAlerts) {
      budgets.forEach((budget) => {
        const percentage = ((budget.spent || 0) / (budget.limit || 1)) * 100;

        if (percentage >= 100) {
          notifications.push({
            id: `budget-exceeded-${budget.id}`,
            title: 'Presupuesto Excedido!',
            message: `Has excedido tu presupuesto de ${budget.category} por ${formatAmount((budget.spent || 0) - (budget.limit || 0))}.`,
            date: today,
            read: false,
            type: 'warning',
            category: 'budget',
          });
        } else if (percentage >= 90) {
          notifications.push({
            id: `budget-critical-${budget.id}`,
            title: 'Presupuesto Crítico',
            message: `Has usado ${Math.round(percentage)}% de tu presupuesto de ${budget.category}. Quedan ${formatAmount((budget.limit || 0) - (budget.spent || 0))}.`,
            date: today,
            read: false,
            type: 'warning',
            category: 'budget',
          });
        } else if (percentage >= settings.budgetThreshold) {
          notifications.push({
            id: `budget-alert-${budget.id}`,
            title: 'Alerta de Presupuesto',
            message: `Has alcanzado ${Math.round(percentage)}% de tu presupuesto de ${budget.category} este mes.`,
            date: today,
            read: false,
            type: 'warning',
            category: 'budget',
          });
        }
      });
    }

    // Upcoming bills - only if enabled
    if (settings.billReminders) {
      upcomingBills.forEach((bill) => {
        const nextDate = parseISO(bill.nextDate);
        const daysUntil = differenceInDays(nextDate, now);

        if (daysUntil >= 0 && daysUntil <= settings.billReminderDays) {
          let title = 'Factura Próxima';
          let message = '';

          if (daysUntil === 0) {
            title = 'Factura Vence Hoy!';
            message = `${bill.description} (${formatAmount(bill.amount)}) vence hoy.`;
          } else if (daysUntil === 1) {
            title = 'Factura Vence Mañana';
            message = `${bill.description} (${formatAmount(bill.amount)}) vence mañana.`;
          } else {
            message = `${bill.description} (${formatAmount(bill.amount)}) vence en ${daysUntil} días el ${format(nextDate, 'MMM d')}.`;
          }

          notifications.push({
            id: `bill-${bill.id}`,
            title,
            message,
            date: today,
            read: false,
            type: daysUntil <= 1 ? 'warning' : 'info',
            category: 'bill',
          });
        }
      });
    }

    // Goal progress notifications - only if enabled
    if (settings.goalUpdates) {
      goals.forEach((goal) => {
        const percentage = ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100;
        const deadline = goal.deadline ? parseISO(goal.deadline) : new Date();
        const daysUntilDeadline = differenceInDays(deadline, now);

        if (percentage >= 100) {
          notifications.push({
            id: `goal-complete-${goal.id}`,
            title: 'Meta Alcanzada! 🎉',
            message: `¡Felicidades! Has alcanzado tu meta de ${goal.name}: ${formatAmount(goal.targetAmount || 0)}.`,
            date: today,
            read: false,
            type: 'success',
            category: 'goal',
          });
        } else if (percentage >= 75) {
          notifications.push({
            id: `goal-progress-${goal.id}`,
            title: 'Progreso de Meta',
            message: `¡Buen trabajo! Llevas ${Math.round(percentage)}% de tu meta ${goal.name}.`,
            date: today,
            read: true,
            type: 'success',
            category: 'goal',
          });
        } else if (daysUntilDeadline <= 30 && daysUntilDeadline > 0 && percentage < 75) {
          notifications.push({
            id: `goal-deadline-${goal.id}`,
            title: 'Fecha Límite Próxima',
            message: `Tu meta ${goal.name} vence en ${daysUntilDeadline} días. Llevas ${Math.round(percentage)}%.`,
            date: today,
            read: false,
            type: 'warning',
            category: 'goal',
          });
        }
      });
    }

    // Sort by type priority (warning first, then success, then info) and unread first
    return notifications.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      const typePriority = { warning: 0, success: 1, info: 2 };
      return typePriority[a.type] - typePriority[b.type];
    });
  }, [formatAmount, budgets, goals, upcomingBills, settings.budgetAlerts, settings.budgetThreshold, settings.billReminders, settings.billReminderDays, settings.goalUpdates]);

  const [notifications, setNotifications] = useState<Notification[]>(dynamicNotifications);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Update notifications when dynamic notifications change
  useEffect(() => {
    setNotifications(dynamicNotifications);
  }, [dynamicNotifications]);

  // Send push notifications and play sounds for critical alerts (only once per notification)
  useEffect(() => {
    const criticalNotifications = notifications.filter(
      (n) =>
        !n.read &&
        !dismissedIds.has(n.id)
    );

    criticalNotifications.forEach((notification) => {
      // Only send push for critical budget alerts and bills due today/tomorrow
      const isCriticalBudget = notification.category === 'budget' &&
        (notification.title.includes('Excedido') || notification.title.includes('Crítico'));
      const isUrgentBill = notification.category === 'bill' &&
        (notification.title.includes('Hoy') || notification.title.includes('Mañana'));

      // Send push notification
      if (settings.pushEnabled && !sentPushNotifications.current.has(notification.id)) {
        if (isCriticalBudget || isUrgentBill) {
          sendPushNotification(notification.title, {
            body: notification.message,
            tag: notification.id,
            requireInteraction: true,
          });
          sentPushNotifications.current.add(notification.id);
        }
      }

      // Play sound for new notifications
      if (!playedSoundNotifications.current.has(notification.id)) {
        playNotificationSound(notification.type);
        playedSoundNotifications.current.add(notification.id);
      }
    });
  }, [notifications, settings.pushEnabled, dismissedIds, sendPushNotification, playNotificationSound]);

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-[hsl(43,74%,66%)]';
      case 'success':
        return 'bg-[hsl(142,76%,36%)]';
      default:
        return 'bg-primary';
    }
  };

  const getTypeIcon = (type: Notification['type'], category: Notification['category']) => {
    if (category === 'budget') {
      return <AlertTriangle className="h-3 w-3 text-[hsl(43,74%,46%)]" />;
    }
    if (category === 'bill') {
      return <Calendar className="h-3 w-3 text-primary" />;
    }
    if (category === 'goal') {
      return <TrendingUp className="h-3 w-3 text-[hsl(142,76%,36%)]" />;
    }
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-[hsl(43,74%,46%)]" />;
      case 'success':
        return <TrendingUp className="h-3 w-3 text-[hsl(142,76%,36%)]" />;
      default:
        return <Calendar className="h-3 w-3 text-primary" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Marcar todo como leído
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {visibleNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Sin notificaciones
            </div>
          ) : (
            visibleNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex cursor-pointer flex-col items-start gap-1 p-3"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full ${getTypeColor(notification.type)} ${notification.read ? 'opacity-30' : ''
                        }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(notification.type, notification.category)}
                        <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                          {notification.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {formatRelativeDate(notification.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => markAsRead(notification.id)}
                        aria-label="Marcar como leído"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                      aria-label="Eliminar notificación"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;