import { useState, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Download, TrendingUp, TrendingDown, PiggyBank, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/features/StatCard';
import CategoryPieChart from '@/components/features/CategoryPieChart';
import SpendingLineChart from '@/components/features/SpendingLineChart';
import MonthlyBarChart from '@/components/features/MonthlyBarChart';
import DateRangePicker from '@/components/features/DateRangePicker';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useMonthlyComparison, useBalanceHistory } from '@/lib/api/hooks';
import type { CategoryData, BalanceHistory, MonthlyComparison } from '@/lib/api/types';

const Reports = () => {
  const { formatAmount, currency } = useCurrency();
  const { t } = useLanguage();
  const { toast } = useToast();

  // API hooks
  const { data: transactionsData, isLoading: txLoading } = useTransactions();
  const { data: monthlyData } = useMonthlyComparison();
  const { data: balanceData } = useBalanceHistory();

  const transactions = transactionsData || [];
  const monthlyComparison = monthlyData || [];
  const balanceHistory = balanceData || [];

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 2),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<'overview' | 'categories' | 'trends'>('overview');

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!dateRange?.from) return true;
      const txDate = new Date(t.date);
      if (dateRange.to) {
        return txDate >= dateRange.from && txDate <= dateRange.to;
      }
      return txDate >= dateRange.from;
    });
  }, [transactions, dateRange]);

  // Calculate stats for filtered transactions
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type?.toUpperCase() === 'INCOME')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = filteredTransactions
      .filter((t) => t.type?.toUpperCase() === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return { income, expenses, net: income - expenses, savingsRate };
  }, [filteredTransactions]);

  // Category breakdown with colors
  const categoryData: CategoryData[] = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type?.toUpperCase() === 'EXPENSE');
    const categoryTotals = expenses.reduce((acc, t) => {
      const cat = t.category || 'Otros';
      acc[cat] = (acc[cat] || 0) + (t.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const colors = [
      'hsl(330, 90%, 46%)', 'hsl(173, 58%, 39%)', 'hsl(197, 37%, 24%)',
      'hsl(43, 74%, 66%)', 'hsl(27, 87%, 67%)', 'hsl(280, 65%, 60%)'
    ];
    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const handleExport = (type: 'csv' | 'pdf') => {
    toast({
      title: t('reports.exportStarted'),
      description: t('reports.exportingFormat', { format: type.toUpperCase() }),
    });
    // Export logic would go here
  };

  if (txLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('reports.title')}</h1>
            <p className="text-muted-foreground">{t('reports.subtitle')}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="card-elevated">
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('reports.totalIncome')}
          value={stats.income}
          icon={TrendingUp}
          variant="income"
          className="card-elevated"
        />
        <StatCard
          title={t('reports.totalExpenses')}
          value={stats.expenses}
          icon={TrendingDown}
          variant="expense"
          className="card-elevated"
        />
        <StatCard
          title={t('reports.netBalance')}
          value={stats.net}
          icon={PiggyBank}
          className="card-elevated"
        />
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('reports.savingsRate')}</p>
                <p className="text-2xl font-bold">{stats.savingsRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as 'overview' | 'categories' | 'trends')}>
        <TabsList>
          <TabsTrigger value="overview">{t('reports.overview')}</TabsTrigger>
          <TabsTrigger value="categories">{t('reports.categories')}</TabsTrigger>
          <TabsTrigger value="trends">{t('reports.trends')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">{t('reports.spendingByCategory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={categoryData} />
              </CardContent>
            </Card>
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">{t('reports.monthlyComparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart data={monthlyComparison as MonthlyComparison[]} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{t('reports.categoryBreakdown')}</CardTitle>
              <CardDescription>{t('reports.periodSummary')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('reports.noExpensesInPeriod')}
                  </p>
                ) : (
                  categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {stats.expenses > 0 ? ((cat.value / stats.expenses) * 100).toFixed(1) : 0}%
                        </span>
                        <span className="font-semibold">{formatAmount(cat.value)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{t('reports.balanceOverTime')}</CardTitle>
              <CardDescription>{t('reports.trackProgress')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SpendingLineChart data={balanceHistory as BalanceHistory[]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
