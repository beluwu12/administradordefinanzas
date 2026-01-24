import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CategoryData } from '@/lib/api/types';

const primaryColors = [
  'hsl(330, 90%, 46%)', 'hsl(173, 58%, 39%)', 'hsl(197, 37%, 24%)',
  'hsl(43, 74%, 66%)', 'hsl(27, 87%, 67%)', 'hsl(280, 65%, 60%)'
];

interface CategoryPieChartProps {
  data: CategoryData[];
  isLoading?: boolean;
}

const CategoryPieChart = ({ data, isLoading = false }: CategoryPieChartProps) => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();

  // Apply harmonized colors
  const coloredData = data.map((item, index) => ({
    ...item,
    color: item.color || primaryColors[index % primaryColors.length],
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }) => {
    if (active && payload && payload.length) {
      const tooltipData = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg backdrop-blur-sm">
          <p className="font-medium">{tooltipData.name}</p>
          <p className="text-sm text-muted-foreground">{formatAmount(tooltipData.value)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <Skeleton className="h-6 w-40 shimmer" />
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full shimmer" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={coloredData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                animationBegin={0}
                animationDuration={800}
              >
                {coloredData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryPieChart;
