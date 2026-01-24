import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatCardProps {
  title: string;
  value: number;
  percentChange?: number;
  icon: LucideIcon;
  variant?: 'default' | 'income' | 'expense';
  isCurrency?: boolean;
  isPercentage?: boolean;
  isLoading?: boolean;
  className?: string;
  secondaryText?: string;
}

const StatCard = ({
  title,
  value,
  percentChange,
  icon: Icon,
  variant = 'default',
  isCurrency = true,
  isPercentage = false,
  isLoading = false,
  className,
  secondaryText,
}: StatCardProps) => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const isPositive = percentChange !== undefined ? percentChange >= 0 : true;
  const safeValue = value ?? 0;

  if (isLoading) {
    return (
      <Card className={cn("card-elevated", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20 shimmer" />
            <Skeleton className="h-10 w-10 rounded-full shimmer" />
          </div>
          <Skeleton className="mt-4 h-8 w-32 shimmer" />
          <Skeleton className="mt-2 h-4 w-24 shimmer" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("card-elevated transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110',
              variant === 'income' && 'bg-success/10 text-success',
              variant === 'expense' && 'bg-destructive/10 text-destructive',
              variant === 'default' && 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight">
            {isPercentage ? `${safeValue.toFixed(1)}%` : isCurrency ? formatAmount(safeValue) : safeValue}
          </p>
          {secondaryText && (
            <p className="text-sm text-muted-foreground mt-1">{secondaryText}</p>
          )}

          {percentChange !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {formatPercentage(percentChange)}
              </span>
              <span className="text-sm text-muted-foreground">{t('dashboard.vsLastMonth')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
