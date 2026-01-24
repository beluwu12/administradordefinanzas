import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BudgetCardProps {
  category: string;
  spent: number;
  limit: number;
  color: string;
  icon?: React.ReactNode;
}

const BudgetCard = ({ category, spent, limit, color, icon }: BudgetCardProps) => {
  const { formatAmount } = useCurrency();
  const percentage = Math.min((spent / limit) * 100, 100);
  const remaining = limit - spent;
  const isOverBudget = spent > limit;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}20` }}
              >
                <span style={{ color }}>{icon}</span>
              </div>
            )}
            <span className="font-medium">{category}</span>
          </div>
          <span className={cn(
            'text-sm font-medium',
            isOverBudget ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {isOverBudget ? 'Over budget!' : `${formatAmount(remaining)} left`}
          </span>
        </div>
        
        <Progress 
          value={percentage} 
          className="h-2"
          style={{ 
            ['--progress-background' as string]: isOverBudget ? 'hsl(var(--destructive))' : color 
          }}
        />
        
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>{formatAmount(spent)} spent</span>
          <span>{formatAmount(limit)} budget</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
