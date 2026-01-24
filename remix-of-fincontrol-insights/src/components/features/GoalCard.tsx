import { Target, Calendar, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';

interface GoalCardProps {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  onAddFunds?: (id: string) => void;
}

const GoalCard = ({ 
  id, 
  name, 
  targetAmount, 
  currentAmount, 
  deadline, 
  color,
  onAddFunds 
}: GoalCardProps) => {
  const { formatAmount } = useCurrency();
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = targetAmount - currentAmount;
  const isCompleted = currentAmount >= targetAmount;
  const deadlineDate = new Date(deadline);
  const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <Target className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(deadline)}</span>
              </div>
            </div>
          </div>
          {isCompleted ? (
            <Badge className="bg-primary/10 text-primary">Completed!</Badge>
          ) : daysLeft <= 30 ? (
            <Badge variant="secondary">{daysLeft} days left</Badge>
          ) : null}
        </div>

        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-bold">{formatAmount(currentAmount)}</span>
            <span className="text-sm text-muted-foreground">of {formatAmount(targetAmount)}</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2"
            style={{ ['--progress-background' as string]: color }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{percentage.toFixed(0)}% complete</span>
          </div>
          {!isCompleted && onAddFunds && (
            <Button size="sm" variant="outline" onClick={() => onAddFunds(id)}>
              Add Funds
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalCard;
