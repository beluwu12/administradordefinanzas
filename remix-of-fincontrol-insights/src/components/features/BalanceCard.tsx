import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface BalanceCardProps {
  balance: number;
  percentChange?: number;
  isLoading?: boolean;
  secondaryAmount?: string;
}

const BalanceCard = ({
  balance,
  percentChange = 0,
  isLoading = false,
  secondaryAmount,
}: BalanceCardProps) => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const isPositive = percentChange >= 0;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary to-primary/80">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
          <Skeleton className="mt-2 h-10 w-48 bg-primary-foreground/20" />
          <Skeleton className="mt-1 h-5 w-36 bg-primary-foreground/20" />
          <Skeleton className="mt-4 h-4 w-24 bg-primary-foreground/20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-primary-foreground/80">{t('dashboard.balance')}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          {formatAmount(balance)}
        </h2>
        {secondaryAmount && (
          <p className="mt-1 text-lg text-primary-foreground/70">
            {secondaryAmount}
          </p>
        )}

        <div className="mt-4 flex items-center gap-1">
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-primary-foreground" />
          )}
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{percentChange.toFixed(1)}% {t('dashboard.vsLastMonth')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
