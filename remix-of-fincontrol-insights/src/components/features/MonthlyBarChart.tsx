import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MonthlyComparison } from '@/lib/api/types';

// Chart colors for income/expense
const INCOME_COLOR = 'hsl(142, 76%, 36%)';
const EXPENSE_COLOR = 'hsl(330, 90%, 46%)';

interface MonthlyBarChartProps {
  data: MonthlyComparison[];
  isLoading?: boolean;
}

const MonthlyBarChart = ({ data, isLoading = false }: MonthlyBarChartProps) => {
  const { formatAmount, formatCompact } = useCurrency();
  const { t } = useLanguage();

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; fill: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg backdrop-blur-sm">
          <p className="mb-2 font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.fill }}>
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="col-span-full card-elevated">
        <CardHeader>
          <Skeleton className="h-6 w-56 shimmer" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full shimmer" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full card-elevated transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>{t('dashboard.incomeVsExpenses')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => formatCompact(value)}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground capitalize">{value}</span>
                )}
              />
              <Bar
                dataKey="income"
                fill={INCOME_COLOR}
                radius={[4, 4, 0, 0]}
                name={t('transactions.income')}
                animationBegin={0}
                animationDuration={800}
              />
              <Bar
                dataKey="expenses"
                fill={EXPENSE_COLOR}
                radius={[4, 4, 0, 0]}
                name={t('transactions.expenses')}
                animationBegin={200}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyBarChart;
