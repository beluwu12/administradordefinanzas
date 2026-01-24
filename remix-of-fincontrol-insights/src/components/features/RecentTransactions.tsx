import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatShortDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Transaction } from '@/lib/api/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const RecentTransactions = ({ transactions, isLoading = false }: RecentTransactionsProps) => {
  const { formatAmount } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/transactions">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((transaction) => {
            const isIncome = transaction.type === 'income';
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(transaction.date)}
                    </span>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {transaction.category}
                    </Badge>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-semibold',
                    isIncome ? 'text-success' : 'text-destructive'
                  )}
                >
                  {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
