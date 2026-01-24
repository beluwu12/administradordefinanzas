import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, CheckCircle, Plus, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatCard from '@/components/features/StatCard';
import GoalForm from '@/components/features/GoalForm';
import AddFundsForm from '@/components/features/AddFundsForm';
import EmptyState from '@/components/features/EmptyState';
import { formatDate } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useGoals, useCreateGoal, useAddContribution } from '@/lib/api/hooks';
import type { Goal, GoalInput, ContributionInput } from '@/lib/api/types';

const goalColors = [
  'hsl(142, 76%, 36%)',
  'hsl(330, 90%, 46%)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(43, 74%, 66%)',
  'hsl(27, 87%, 67%)',
];

const Goals = () => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const { toast } = useToast();

  // API hooks
  const { data: goalsData, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const addContribution = useAddContribution();

  const goals = goalsData || [];

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<Goal | null>(null);

  const totals = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const completedGoals = goals.filter((g) => (g.currentAmount || 0) >= (g.targetAmount || 0)).length;
    return { totalTarget, totalSaved, completedGoals, totalGoals: goals.length };
  }, [goals]);

  const handleAddGoal = async (data: { name: string; targetAmount: number; currentAmount: number; deadline: Date }) => {
    const input: GoalInput = {
      title: data.name,
      totalCost: data.targetAmount,
      monthlyAmount: data.targetAmount / 12, // approximate monthly
      color: goalColors[goals.length % goalColors.length],
    };

    try {
      await createGoal.mutateAsync(input);
      setIsDialogOpen(false);
      toast({
        title: t('toast.goalCreated'),
        description: `"${data.name}"`,
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('error.goalCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleAddFunds = async (data: { amount: number; note?: string }) => {
    if (!addFundsGoal) return;

    const input: ContributionInput = {
      amount: data.amount,
      note: data.note,
    };

    try {
      await addContribution.mutateAsync({ goalId: addFundsGoal.id, data: input });
      toast({
        title: t('toast.fundsAdded'),
        description: `${formatAmount(data.amount)} → "${addFundsGoal.name}"`,
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('error.fundsAdd'),
        variant: 'destructive',
      });
    } finally {
      setAddFundsGoal(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('goals.title')}</h1>
          <p className="text-muted-foreground">{t('goals.subtitle')}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('goals.addGoal')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('goals.totalTarget')}
          value={totals.totalTarget}
          icon={Target}
          isLoading={isLoading}
          className="card-elevated"
        />
        <StatCard
          title={t('goals.totalSaved')}
          value={totals.totalSaved}
          icon={TrendingUp}
          variant="income"
          isLoading={isLoading}
          className="card-elevated"
        />
        {isLoading ? (
          <Card className="card-elevated">
            <CardContent className="flex items-center gap-4 p-6">
              <Skeleton className="h-10 w-10 rounded-lg shimmer" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 shimmer" />
                <Skeleton className="h-6 w-16 shimmer" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-elevated transition-all duration-300 hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('goals.goalsCompleted')}</p>
                <p className="text-2xl font-bold">
                  {totals.completedGoals} / {totals.totalGoals}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Card */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">{t('goals.overallProgress')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full shimmer" />
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {totals.totalTarget > 0
                    ? ((totals.totalSaved / totals.totalTarget) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatAmount(totals.totalSaved)} {t('goals.savedOf')} {formatAmount(totals.totalTarget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {formatAmount(totals.totalTarget - totals.totalSaved)}
                </p>
                <p className="text-sm text-muted-foreground">{t('goals.remainingToReach')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('goals.yourGoals')}</h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-5">
                  <Skeleton className="mb-4 h-10 w-full shimmer" />
                  <Skeleton className="mb-2 h-8 w-3/4 shimmer" />
                  <Skeleton className="mb-3 h-2 w-full shimmer" />
                  <Skeleton className="h-6 w-1/2 shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            type="goals"
            title={t('empty.noGoals')}
            description={t('empty.noGoalsDesc')}
            action={{ label: t('goals.addGoal'), onClick: () => setIsDialogOpen(true) }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal, index) => {
              const currentAmount = goal.currentAmount || 0;
              const targetAmount = goal.targetAmount || 1;
              const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
              const isCompleted = currentAmount >= targetAmount;
              const deadline = goal.deadline || new Date().toISOString();
              const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const color = goal.color || goalColors[index % goalColors.length];

              return (
                <Card key={goal.id} className="overflow-hidden card-elevated transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-110"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Target className="h-5 w-5" style={{ color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{goal.name}</h3>
                          <p className="text-sm text-muted-foreground">{formatDate(deadline)}</p>
                        </div>
                      </div>
                      {isCompleted ? (
                        <Badge className="bg-primary/10 text-primary">{t('goals.completed')}</Badge>
                      ) : daysLeft <= 30 && daysLeft > 0 ? (
                        <Badge variant="secondary">{daysLeft} {t('goals.daysLeft')}</Badge>
                      ) : null}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-2xl font-bold">{formatAmount(currentAmount)}</span>
                        <span className="text-sm text-muted-foreground">{t('goals.of')} {formatAmount(targetAmount)}</span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2"
                        style={{ ['--progress-background' as string]: color }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{percentage.toFixed(0)}% {t('goals.complete')}</span>
                      <div className="flex gap-2">
                        {!isCompleted && (
                          <Button size="sm" variant="outline" onClick={() => setAddFundsGoal(goal)}>
                            <Plus className="mr-1 h-3 w-3" />
                            {t('goals.addFunds')}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/goals/${goal.id}`)}>
                          <Eye className="mr-1 h-3 w-3" />
                          {t('goals.view')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('goals.addGoal')}</DialogTitle>
          </DialogHeader>
          <GoalForm onSubmit={handleAddGoal} onCancel={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={!!addFundsGoal} onOpenChange={() => setAddFundsGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('goals.addFunds')} - {addFundsGoal?.name}</DialogTitle>
          </DialogHeader>
          {addFundsGoal && (
            <AddFundsForm
              onSubmit={handleAddFunds}
              onCancel={() => setAddFundsGoal(null)}
              maxAmount={(addFundsGoal.targetAmount || 0) - (addFundsGoal.currentAmount || 0)}
              isLoading={addContribution.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
