import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft, Plus, X, RefreshCw, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/features/StatCard';
import TransactionRow from '@/components/features/TransactionRow';
import TransactionEditForm from '@/components/features/TransactionEditForm';
import DateRangePicker from '@/components/features/DateRangePicker';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useCategories } from '@/lib/api/hooks';
import type { Transaction, TransactionInput, Category } from '@/lib/api/types';

type FilterType = 'all' | 'INCOME' | 'EXPENSE';

const Transactions = () => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const { toast } = useToast();

  // API hooks
  const { data: transactionsData, isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  // Local state for UI
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const transactions = transactionsData || [];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tr) => {
      const typeMatch = filter === 'all' || tr.type?.toUpperCase() === filter;
      const categoryMatch = selectedCategory === 'all' || tr.category === selectedCategory;

      let dateMatch = true;
      if (dateRange?.from) {
        const txDate = new Date(tr.date);
        dateMatch = txDate >= dateRange.from;
        if (dateRange.to) {
          dateMatch = dateMatch && txDate <= dateRange.to;
        }
      }

      return typeMatch && categoryMatch && dateMatch;
    });
  }, [transactions, filter, selectedCategory, dateRange]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((tr) => tr.type?.toUpperCase() === 'INCOME')
      .reduce((sum, tr) => sum + (tr.amount || 0), 0);
    const expenses = transactions
      .filter((tr) => tr.type?.toUpperCase() === 'EXPENSE')
      .reduce((sum, tr) => sum + (tr.amount || 0), 0);
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const handleAddTransaction = async (data: { type: 'income' | 'expense'; amount: number; category: string; description: string; date: Date }) => {
    const category = categories.find(c => c.name === data.category);
    const input: TransactionInput = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date.toISOString(),
      categoryId: category?.id || '',
    };

    try {
      await createTransaction.mutateAsync(input);
      setDialogOpen(false);
      toast({
        title: t('toast.transactionAdded'),
        description: data.type === 'income'
          ? t('transactions.incomeOf', { amount: formatAmount(data.amount) })
          : t('transactions.expenseOf', { amount: formatAmount(data.amount) }),
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('error.transactionCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleEditTransaction = async (data: { type: 'income' | 'expense'; amount: number; category: string; description: string; date: Date }) => {
    if (!editingTransaction) return;
    const category = categories.find(c => c.name === data.category);

    try {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date.toISOString(),
          categoryId: category?.id,
        },
      });
      setEditingTransaction(null);
      toast({
        title: t('toast.transactionUpdated'),
        description: t('transactions.hasBeenUpdated'),
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('error.transactionUpdate'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction.mutateAsync(deletingTransaction.id);
      toast({
        title: t('toast.transactionDeleted'),
        description: t('transactions.hasBeenRemoved'),
        variant: 'destructive',
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('error.transactionDelete'),
        variant: 'destructive',
      });
    } finally {
      setDeletingTransaction(null);
    }
  };

  const handleEdit = (id: string) => {
    const transaction = transactions.find(tr => tr.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
    }
  };

  const handleDelete = (id: string) => {
    const transaction = transactions.find(tr => tr.id === id);
    if (transaction) {
      setDeletingTransaction(transaction);
    }
  };

  const clearDateRange = () => {
    setDateRange(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('transactions.title')}</h1>
          <p className="text-muted-foreground">{t('transactions.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('transactions.addTransaction')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('transactions.newTransaction')}</DialogTitle>
            </DialogHeader>
            <TransactionEditForm
              onSubmit={handleAddTransaction}
              onCancel={() => setDialogOpen(false)}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('transactions.income')}
          value={stats.income}
          icon={TrendingUp}
          variant="income"
          isLoading={isLoading}
        />
        <StatCard
          title={t('transactions.expenses')}
          value={stats.expenses}
          icon={TrendingDown}
          variant="expense"
          isLoading={isLoading}
        />
        <StatCard
          title={t('transactions.net')}
          value={stats.net}
          icon={ArrowRightLeft}
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <TabsList>
                <TabsTrigger value="all">{t('transactions.all')}</TabsTrigger>
                <TabsTrigger value="INCOME">{t('transactions.income')}</TabsTrigger>
                <TabsTrigger value="EXPENSE">{t('transactions.expenses')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('transactions.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.allCategories')}</SelectItem>
                {categories.map((cat: Category) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-full sm:w-auto"
            />
            {dateRange && (
              <Button variant="ghost" size="icon" onClick={clearDateRange} aria-label="Clear date filter">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
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
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {t('transactions.noTransactions')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('transactions.editTransaction')}</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionEditForm
              transaction={editingTransaction}
              onSubmit={handleEditTransaction}
              onCancel={() => setEditingTransaction(null)}
              categories={categories}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Confirmation */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.deleteTransaction')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>
              {deleteTransaction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transactions;