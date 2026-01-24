import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Receipt, Tag, Wallet, Target, LayoutDashboard, BarChart3, Settings, FileText } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions, useBudgets, useGoals, useCategories } from '@/lib/api/hooks';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  // API hooks
  const { data: transactionsData } = useTransactions({ limit: 20 });
  const { data: budgetsData } = useBudgets();
  const { data: goalsData } = useGoals();
  const { data: categoriesData } = useCategories();

  const transactions = transactionsData || [];
  const budgets = budgetsData || [];
  const goals = goalsData || [];
  const categories = categoriesData || [];

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Filter results based on search
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions.slice(0, 5);
    return transactions
      .filter(tx =>
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.category?.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5);
  }, [search, transactions]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories.slice(0, 5);
    return categories
      .filter(cat => cat.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [search, categories]);

  const filteredBudgets = useMemo(() => {
    if (!search.trim()) return budgets.slice(0, 5);
    return budgets
      .filter(b => b.category?.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [search, budgets]);

  const filteredGoals = useMemo(() => {
    if (!search.trim()) return goals.slice(0, 5);
    return goals
      .filter(g => g.name?.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [search, goals]);

  const pages = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.transactions'), path: '/transactions', icon: Receipt },
    { name: t('nav.categories'), path: '/categories', icon: Tag },
    { name: t('nav.budget'), path: '/budget', icon: Wallet },
    { name: t('nav.goals'), path: '/goals', icon: Target },
    { name: t('nav.reports'), path: '/reports', icon: BarChart3 },
    { name: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;
    return pages.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, t]);

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t('search.global')}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{t('search.noResults')}</CommandEmpty>

        {/* Pages */}
        {filteredPages.length > 0 && (
          <CommandGroup heading={t('search.pages')}>
            {filteredPages.map((page) => (
              <CommandItem
                key={page.path}
                onSelect={() => handleSelect(page.path)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <page.icon className="h-4 w-4 text-muted-foreground" />
                <span>{page.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Transactions */}
        {filteredTransactions.length > 0 && (
          <CommandGroup heading={t('search.transactions')}>
            {filteredTransactions.map((tx) => (
              <CommandItem
                key={tx.id}
                onSelect={() => handleSelect('/transactions')}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span>{tx.description}</span>
                  <Badge variant="secondary" className="text-xs">{tx.category}</Badge>
                </div>
                <span className={tx.type?.toUpperCase() === 'INCOME' ? 'text-success' : 'text-destructive'}>
                  {tx.type?.toUpperCase() === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount || 0)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Categories */}
        {filteredCategories.length > 0 && (
          <CommandGroup heading={t('search.categories')}>
            {filteredCategories.map((cat) => (
              <CommandItem
                key={cat.id}
                onSelect={() => handleSelect('/categories')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.color || 'hsl(240, 5%, 64%)' }}
                />
                <span>{cat.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Budgets */}
        {filteredBudgets.length > 0 && (
          <CommandGroup heading={t('search.budgets')}>
            {filteredBudgets.map((budget) => (
              <CommandItem
                key={budget.id}
                onSelect={() => handleSelect('/budget')}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span>{budget.category}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatAmount(budget.spent || 0)} / {formatAmount(budget.limit || 0)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Goals */}
        {filteredGoals.length > 0 && (
          <CommandGroup heading={t('search.goals')}>
            {filteredGoals.map((goal) => (
              <CommandItem
                key={goal.id}
                onSelect={() => handleSelect(`/goals/${goal.id}`)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{goal.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100).toFixed(0)}%
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
