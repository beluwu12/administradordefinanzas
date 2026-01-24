import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionRow from './TransactionRow';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions } from '@/lib/api/hooks';

interface CategoryTransactionsDialogProps {
  category: string | null;
  color?: string;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const CategoryTransactionsDialog = ({
  category,
  color,
  onClose,
  onEdit,
  onDelete,
}: CategoryTransactionsDialogProps) => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();

  // API hook - fetch all transactions and filter by category
  const { data: allTransactions, isLoading } = useTransactions();

  const transactions = useMemo(() => {
    if (!category || !allTransactions) return [];
    return allTransactions.filter(t => t.category === category);
  }, [category, allTransactions]);

  const totals = useMemo(() => {
    const income = transactions
      .filter(t => t.type?.toUpperCase() === 'INCOME')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = transactions
      .filter(t => t.type?.toUpperCase() === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  return (
    <Dialog open={!!category} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            {category} - {t('transactions.title')}
            <Badge variant="secondary" className="ml-2">
              {transactions.length} {t('transactions.title').toLowerCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">{t('dashboard.income')}</p>
            <p className="text-lg font-semibold text-success">
              {formatAmount(totals.income)}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">{t('dashboard.expenses')}</p>
            <p className="text-lg font-semibold text-destructive">
              {formatAmount(totals.expenses)}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">{t('dashboard.balance')}</p>
            <p className={`text-lg font-semibold ${totals.net >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatAmount(totals.net)}
            </p>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('empty.noTransactions')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('transactions.date')}</TableHead>
                  <TableHead>{t('transactions.description')}</TableHead>
                  <TableHead>{t('transactions.category')}</TableHead>
                  <TableHead className="text-right">{t('transactions.amount')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryTransactionsDialog;
