import { useState, useMemo } from 'react';
import { Wallet, TrendingUp, PiggyBank, Plus, Pencil, Trash2, RotateCcw, MoreHorizontal, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatCard from '@/components/features/StatCard';
import BudgetForm from '@/components/features/BudgetForm';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useCategories } from '@/lib/api/hooks';
import type { Budget as BudgetType, Category } from '@/lib/api/types';

const Budget = () => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const { toast } = useToast();

  // API hooks
  const { data: budgetsData, isLoading: budgetsLoading } = useBudgets();
  const { data: categoriesData } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const isLoading = budgetsLoading;
  const budgets = budgetsData || [];
  const categories = categoriesData || [];

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetType | null>(null);

  const totals = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + (b.limit || 0) + (b.rolloverAmount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const totalRollover = budgets.reduce((sum, b) => sum + (b.rolloverAmount || 0), 0);
    return { totalBudget, totalSpent, remaining, percentage, totalRollover };
  }, [budgets]);

  const handleAddBudget = async (data: { category: string; limit: number }) => {
    const category = categories.find(c => c.name === data.category);
    if (!category) {
      toast({
        title: t('common.error'),
        description: t('error.categoryNotFound'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await createBudget.mutateAsync({
        tagId: category.id,
        limit: data.limit,
      });
      setIsDialogOpen(false);
      toast({
        title: t('toast.budgetCreated'),
        description: `${t('budget.title')} ${data.category}`,
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('error.budgetCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleEditBudget = async (data: { category: string; limit: number }) => {
    if (!editingBudget) return;

    try {
      await updateBudget.mutateAsync({
        id: editingBudget.id,
        data: { limit: data.limit },
      });
      setEditingBudget(null);
      toast({
        title: t('toast.budgetUpdated'),
        description: `${t('budget.title')} ${data.category}`,
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('error.budgetUpdate'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;

    try {
      await deleteBudget.mutateAsync(deletingBudget.id);
      toast({
        title: t('toast.budgetDeleted'),
        description: `${t('budget.title')} ${deletingBudget.category}`,
        variant: 'destructive',
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('error.budgetDelete'),
        variant: 'destructive',
      });
    } finally {
      setDeletingBudget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('budget.title')}</h1>
          <p className="text-muted-foreground">{t('budget.subtitle')}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('budget.addBudget')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('budget.totalBudget')}
          value={totals.totalBudget}
          icon={Wallet}
          isLoading={isLoading}
          className="card-elevated"
        />
        <StatCard
          title={t('budget.totalSpent')}
          value={totals.totalSpent}
          icon={TrendingUp}
          variant="expense"
          isLoading={isLoading}
          className="card-elevated"
        />
        <StatCard
          title={t('budget.remaining')}
          value={totals.remaining}
          icon={PiggyBank}
          variant="income"
          isLoading={isLoading}
          className="card-elevated"
        />
      </div>

      {/* Overall Progress */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">{t('budget.monthlyOverview')}</CardTitle>
          {totals.totalRollover > 0 && (
            <CardDescription className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('budget.rolloverAmount')}: {formatAmount(totals.totalRollover)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full shimmer" />
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatAmount(totals.totalSpent)} {t('budget.spent')} / {formatAmount(totals.totalBudget)}
                </span>
                <span className="font-medium">{(totals.percentage || 0).toFixed(1)}%</span>
              </div>
              <Progress value={totals.percentage} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {formatAmount(totals.remaining)} {t('budget.remaining')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('budget.categoryBudgets')}</h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-8 w-full shimmer" />
                  <Skeleton className="mb-2 h-2 w-full shimmer" />
                  <Skeleton className="h-4 w-3/4 shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">{t('empty.noBudgets')}</p>
              <p className="text-sm text-muted-foreground">{t('empty.noBudgetsDesc')}</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('budget.addBudget')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
              const effectiveLimit = (budget.limit || 0) + (budget.rolloverAmount || 0);
              const spent = budget.spent || 0;
              const percentage = effectiveLimit > 0 ? Math.min((spent / effectiveLimit) * 100, 100) : 0;
              const remaining = effectiveLimit - spent;
              const isOverBudget = spent > effectiveLimit;

              return (
                <Card key={budget.id} className="overflow-hidden card-elevated transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform hover:scale-110"
                          style={{ backgroundColor: `${budget.color}20` }}
                        >
                          <span style={{ color: budget.color }}>📁</span>
                        </div>
                        <span className="font-medium">{budget.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-medium',
                          isOverBudget ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {isOverBudget ? t('budget.overBudget') : `${formatAmount(remaining)} ${t('budget.left')}`}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingBudget(budget)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingBudget(budget)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <Progress
                      value={percentage}
                      className="h-2"
                      style={{
                        ['--progress-background' as string]: isOverBudget ? 'hsl(var(--destructive))' : budget.color
                      }}
                    />

                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                      <span>{formatAmount(spent)} {t('budget.spent')}</span>
                      <span>{formatAmount(effectiveLimit)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budget.addBudget')}</DialogTitle>
          </DialogHeader>
          <BudgetForm
            onSubmit={handleAddBudget}
            onCancel={() => setIsDialogOpen(false)}
            categories={categories}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.edit')} {t('budget.title')}</DialogTitle>
          </DialogHeader>
          {editingBudget && (
            <BudgetForm
              onSubmit={handleEditBudget}
              onCancel={() => setEditingBudget(null)}
              defaultValues={{
                category: editingBudget.category,
                limit: editingBudget.limit,
              }}
              categories={categories}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBudget} onOpenChange={() => setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('budget.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirm')} "{deletingBudget?.category}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget}>
              {deleteBudget.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Budget;
