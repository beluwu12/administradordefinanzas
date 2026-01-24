import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import BalanceCard from '@/components/features/BalanceCard';
import StatCard from '@/components/features/StatCard';
import CategoryPieChart from '@/components/features/CategoryPieChart';
import SpendingLineChart from '@/components/features/SpendingLineChart';
import MonthlyBarChart from '@/components/features/MonthlyBarChart';
import RecentTransactions from '@/components/features/RecentTransactions';
import BillCalendar from '@/components/features/BillCalendar';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSummary, useMonthlyComparison, useBalanceHistory, useTransactions, useCategories, useExchangeRate, convertVesToUsd, convertUsdToVes } from '@/lib/api/hooks';
import type { CategoryData } from '@/lib/api/types';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currency, formatAmount } = useCurrency();

  // API hooks for real data
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyComparison(5);
  const { data: balanceHistory, isLoading: balanceLoading } = useBalanceHistory(30);
  const { data: transactionsData, isLoading: txLoading } = useTransactions({ limit: 10 });
  const { data: categoriesData } = useCategories();
  const { data: exchangeRateData } = useExchangeRate();

  const isLoading = summaryLoading || monthlyLoading || balanceLoading || txLoading;
  const categories = categoriesData || [];
  const bcvRate = exchangeRateData?.rate || null;
  const isDual = summary?.isDual || false;

  // Get totals by currency - backend provides these separated
  const incomeUSD = summary?.totalIncome?.['USD'] || 0;
  const incomeVES = summary?.totalIncome?.['VES'] || 0;
  const expensesUSD = summary?.totalExpense?.['USD'] || 0;
  const expensesVES = summary?.totalExpense?.['VES'] || 0;

  // Calculate totals in USD equivalent (for VES, convert using BCV rate)
  const incomeVESinUSD = bcvRate ? (incomeVES / bcvRate) : 0;
  const expensesVESinUSD = bcvRate ? (expensesVES / bcvRate) : 0;

  const totalIncomeUSD = incomeUSD + incomeVESinUSD;
  const totalExpensesUSD = expensesUSD + expensesVESinUSD;
  const totalBalanceUSD = totalIncomeUSD - totalExpensesUSD;

  // Calculate totals in VES equivalent
  const incomeUSDinVES = bcvRate ? (incomeUSD * bcvRate) : 0;
  const expensesUSDinVES = bcvRate ? (expensesUSD * bcvRate) : 0;

  const totalIncomeVES = incomeVES + incomeUSDinVES;
  const totalExpensesVES = expensesVES + expensesUSDinVES;
  const totalBalanceVES = totalIncomeVES - totalExpensesVES;

  // Use the current display currency for main values
  const displayIncome = currency === 'VES' ? totalIncomeVES : totalIncomeUSD;
  const displayExpenses = currency === 'VES' ? totalExpensesVES : totalExpensesUSD;
  const displayBalance = currency === 'VES' ? totalBalanceVES : totalBalanceUSD;
  const savingsRate = displayIncome > 0 ? ((displayIncome - displayExpenses) / displayIncome) * 100 : 0;

  // Format equivalent amount (show conversion)
  const formatEquivalent = (amountInDisplayCurrency: number): string => {
    if (!bcvRate) return '';
    if (currency === 'VES') {
      // Show USD equivalent
      const usdEquiv = amountInDisplayCurrency / bcvRate;
      return `~$${usdEquiv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    } else {
      // Show VES equivalent
      const vesEquiv = amountInDisplayCurrency * bcvRate;
      return `~Bs. ${vesEquiv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const transactions = transactionsData || [];

  // Build category data from transactions using API categories for colors
  const categoryData: CategoryData[] = transactions
    .filter(trans => trans.type?.toUpperCase() === 'EXPENSE')
    .reduce((acc, trans) => {
      const categoryName = trans.category || t('currency.noCategory');
      const existing = acc.find(c => c.name === categoryName);
      const amount = typeof trans.amount === 'number' ? trans.amount : 0;
      const cat = categories.find(c => c.name === categoryName);
      if (existing) {
        existing.value += amount;
      } else {
        acc.push({
          name: categoryName,
          value: amount,
          color: cat?.color || 'hsl(240, 5%, 64%)',
        });
      }
      return acc;
    }, [] as CategoryData[]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t('dashboard.title')}, {user?.name || 'Usuario'}
        </h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        {bcvRate && isDual && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('currency.bcvRate')}: Bs. {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USD
          </p>
        )}
      </div>

      {/* Balance Card */}
      <BalanceCard
        balance={displayBalance}
        percentChange={summary?.changePercent || 0}
        isLoading={isLoading}
        secondaryAmount={isDual && bcvRate ? formatEquivalent(displayBalance) : undefined}
      />

      {/* Breakdown by currency for dual users */}
      {isDual && bcvRate && (incomeUSD > 0 || incomeVES > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('currency.incomeUSD')}</p>
              <p className="text-xl font-bold text-success">${incomeUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('currency.incomeVES')}</p>
              <p className="text-xl font-bold text-success">Bs. {incomeVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('currency.expensesUSD')}</p>
              <p className="text-xl font-bold text-destructive">${expensesUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('currency.expensesVES')}</p>
              <p className="text-xl font-bold text-destructive">Bs. {expensesVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stat Cards - Totals with equivalents */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('dashboard.totalIncome')}
          value={displayIncome}
          percentChange={0}
          icon={TrendingUp}
          variant="income"
          isLoading={isLoading}
          className="card-elevated"
          secondaryText={isDual && bcvRate ? formatEquivalent(displayIncome) : undefined}
        />
        <StatCard
          title={t('dashboard.totalExpenses')}
          value={displayExpenses}
          percentChange={0}
          icon={TrendingDown}
          variant="expense"
          isLoading={isLoading}
          className="card-elevated"
          secondaryText={isDual && bcvRate ? formatEquivalent(displayExpenses) : undefined}
        />
        <StatCard
          title={t('dashboard.savingsRate')}
          value={savingsRate}
          icon={PiggyBank}
          isPercentage
          isCurrency={false}
          isLoading={isLoading}
          className="card-elevated"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart data={categoryData} isLoading={isLoading} />
        <SpendingLineChart data={balanceHistory || []} isLoading={isLoading} />
      </div>

      {/* Bill Calendar & Monthly Comparison */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyBarChart data={monthlyData || []} isLoading={isLoading} />
        </div>
        <BillCalendar />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} isLoading={isLoading} />
    </div>
  );
};

export default Dashboard;
