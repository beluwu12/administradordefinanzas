import { useState, useMemo } from 'react';
import { Plus, Eye, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import CategoryCard from '@/components/features/CategoryCard';
import CategoryPieChart from '@/components/features/CategoryPieChart';
import CategoryForm from '@/components/features/CategoryForm';
import EmptyState from '@/components/features/EmptyState';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useTransactions } from '@/lib/api/hooks';
import type { Category, CategoryData } from '@/lib/api/types';

const Categories = () => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const { toast } = useToast();

  // API hooks
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: transactionsData, isLoading: txLoading } = useTransactions();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const isLoading = categoriesLoading || txLoading;
  const categories = categoriesData || [];
  const transactions = transactionsData || [];

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  // Build category data from transactions
  const categoryData: CategoryData[] = useMemo(() => {
    const expensesByCategory = new Map<string, number>();

    transactions
      .filter(t => t.type?.toUpperCase() === 'EXPENSE')
      .forEach(t => {
        const current = expensesByCategory.get(t.category) || 0;
        expensesByCategory.set(t.category, current + (t.amount || 0));
      });

    return Array.from(expensesByCategory.entries()).map(([name, value]) => {
      const cat = categories.find(c => c.name === name);
      return {
        name,
        value,
        color: cat?.color || 'hsl(240, 5%, 64%)',
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Category stats (count + total)
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};

    transactions.forEach(t => {
      if (!stats[t.category]) {
        stats[t.category] = { count: 0, total: 0 };
      }
      stats[t.category].count++;
      stats[t.category].total += t.amount || 0;
    });

    return stats;
  }, [transactions]);

  const totalExpenses = useMemo(
    () => categoryData.reduce((sum, cat) => sum + cat.value, 0),
    [categoryData]
  );

  const handleAddCategory = async (data: { name: string; icon: string; color: string }) => {
    try {
      await createCategory.mutateAsync({ name: data.name, color: data.color });
      setIsDialogOpen(false);
      toast({
        title: t('toast.categoryCreated'),
        description: `"${data.name}"`,
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('error.categoryCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleEditCategory = async (data: { name: string; icon: string; color: string }) => {
    if (!editingCategory) return;
    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        data: { name: data.name, color: data.color },
      });
      setEditingCategory(null);
      toast({
        title: t('toast.categoryUpdated'),
        description: `"${data.name}"`,
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('error.categoryUpdate'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast({
        title: t('toast.categoryDeleted'),
        description: `"${deletingCategory.name}"`,
        variant: 'destructive',
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('error.categoryDelete'),
        variant: 'destructive',
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  const openEditDialog = (name: string) => {
    const category = categories.find((c) => c.name === name);
    if (category) {
      setEditingCategory(category);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('categories.title')}</h1>
          <p className="text-muted-foreground">{t('categories.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('categories.searchCategories')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:w-64"
            />
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.addCategory')}
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">{t('categories.spendingByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full shimmer" />
              </div>
            ) : (
              <CategoryPieChart data={categoryData} />
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">{t('categories.categorySummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 shimmer" />
                    <Skeleton className="h-4 w-16 shimmer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {categoryData.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatAmount(cat.value)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between font-medium">
                    <span>{t('categories.totalExpenses')}</span>
                    <span>{formatAmount(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('categories.allCategories')}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredCategories.length} {t('categories.of')} {categories.length}
          </p>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            type="search"
            title={t('categories.noCategories')}
            description={t('categories.tryDifferent')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                color={category.color}
                transactionCount={categoryStats[category.name]?.count || 0}
                totalSpent={categoryStats[category.name]?.total || 0}
                icon={<span className="text-lg">📁</span>}
                onEdit={openEditDialog}
                onDelete={(name) => {
                  const cat = categories.find(c => c.name === name);
                  if (cat) setDeletingCategory(cat);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('categories.addCategory')}</DialogTitle>
          </DialogHeader>
          <CategoryForm onSubmit={handleAddCategory} onCancel={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.edit')} {t('categories.title')}</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              onSubmit={handleEditCategory}
              onCancel={() => setEditingCategory(null)}
              defaultValues={{ name: editingCategory.name, color: editingCategory.color, icon: '📁' }}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('categories.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirm')} "{deletingCategory?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>
              {deleteCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;
