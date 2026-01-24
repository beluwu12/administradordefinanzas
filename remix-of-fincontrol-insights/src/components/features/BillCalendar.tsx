import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpcomingBills } from '@/lib/api/hooks';
import type { FixedExpense } from '@/lib/api/types';

interface BillCalendarProps {
  className?: string;
}

const BillCalendar = ({ className }: BillCalendarProps) => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // API hook for upcoming bills (next 60 days to cover current month)
  const { data: upcomingBillsData, isLoading } = useUpcomingBills(60);
  const bills = upcomingBillsData || [];

  // Get days with bills for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const billsByDate = useMemo(() => {
    const map: Record<string, FixedExpense[]> = {};

    bills.forEach(bill => {
      const nextDate = new Date(bill.nextDate);
      if (isSameMonth(nextDate, currentMonth)) {
        const dateKey = format(nextDate, 'yyyy-MM-dd');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(bill);
      }
    });

    return map;
  }, [bills, currentMonth]);

  // Get upcoming bills for this month sorted by date
  const monthBills = useMemo(() => {
    return bills
      .filter(bill => {
        const nextDate = new Date(bill.nextDate);
        return isSameMonth(nextDate, currentMonth);
      })
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
  }, [bills, currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            {t('calendar.title')}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="px-2 text-xs">
              {t('calendar.today')}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}

              {/* Padding for first week */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`padding-${i}`} className="aspect-square" />
              ))}

              {/* Days */}
              {daysInMonth.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayBills = billsByDate[dateKey] || [];
                const hasBills = dayBills.length > 0;
                const isPast = isBefore(day, new Date()) && !isToday(day);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-all duration-200",
                      isToday(day) && "bg-primary text-primary-foreground font-semibold",
                      hasBills && !isToday(day) && "bg-destructive/10 text-destructive font-medium",
                      isPast && !hasBills && "text-muted-foreground/50",
                      !isToday(day) && !hasBills && "hover:bg-muted/50"
                    )}
                  >
                    {format(day, 'd')}
                    {hasBills && (
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {dayBills.slice(0, 3).map((_, i) => (
                          <div key={i} className="h-1 w-1 rounded-full bg-destructive" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upcoming Bills List */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                {t('calendar.upcoming')}
              </h4>

              {monthBills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('calendar.noBills')}
                </p>
              ) : (
                <ScrollArea className="h-[160px]">
                  <div className="space-y-2 pr-2">
                    {monthBills.map((bill) => {
                      const nextDate = new Date(bill.nextDate);
                      const isDueToday = isToday(nextDate);
                      const isOverdue = isBefore(nextDate, new Date()) && !isDueToday;

                      return (
                        <div
                          key={bill.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border transition-all duration-200 hover:shadow-sm",
                            isDueToday && "border-destructive bg-destructive/5",
                            isOverdue && "border-destructive/50 bg-destructive/10"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{bill.description}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(nextDate, 'MMM d')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isDueToday && (
                              <Badge variant="destructive" className="text-xs">
                                {t('calendar.dueToday')}
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                {t('calendar.overdue')}
                              </Badge>
                            )}
                            <span className="font-semibold text-destructive">
                              {formatAmount(bill.amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillCalendar;
