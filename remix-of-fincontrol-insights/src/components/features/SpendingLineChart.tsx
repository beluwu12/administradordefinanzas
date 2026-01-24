import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatShortDate } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BalanceHistory } from '@/lib/api/types';

const CHART_COLOR = 'hsl(200, 70%, 50%)';

interface SpendingLineChartProps {
  data: BalanceHistory[];
  isLoading?: boolean;
}

const SpendingLineChart = ({ data, isLoading = false }: SpendingLineChartProps) => {
  const { formatAmount, formatCompact } = useCurrency();
  const { t } = useLanguage();

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length && label) {
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">{formatShortDate(label)}</p>
          <p className="font-semibold">{formatAmount(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <Skeleton className="h-6 w-48 shimmer" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full shimmer" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>{t('dashboard.balanceOverTime')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatShortDate(value)}
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
              <Area
                type="monotone"
                dataKey="balance"
                stroke={CHART_COLOR}
                strokeWidth={2}
                fill="url(#colorBalance)"
                animationBegin={0}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingLineChart;
