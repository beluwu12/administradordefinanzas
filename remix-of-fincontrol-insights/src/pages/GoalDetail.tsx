import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Calendar, TrendingUp, Plus, Pencil, Trash2, History, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import GoalForm from '@/components/features/GoalForm';
import AddFundsForm from '@/components/features/AddFundsForm';
import { formatDate } from '@/lib/formatters';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useGoal, useUpdateGoal, useDeleteGoal, useAddContribution } from '@/lib/api/hooks';
import type { Goal, GoalInput, ContributionInput, FundHistory } from '@/lib/api/types';

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const { toast } = useToast();

  // API hooks
  const { data: goal, isLoading } = useGoal(id || '');
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const addContribution = useAddContribution();

  // Local state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">{t('goalDetail.goalNotFound')}</h2>
        <Button onClick={() => navigate('/goals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('goalDetail.backToGoals')}
        </Button>
      </div>
    );
  }

  const currentAmount = goal.currentAmount || 0;
  const targetAmount = goal.targetAmount || 1;
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = targetAmount - currentAmount;
  const isCompleted = currentAmount >= targetAmount;
  const deadline = goal.deadline || new Date().toISOString();
  const deadlineDate = new Date(deadline);
  const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const color = goal.color || 'hsl(142, 76%, 36%)';
  const fundHistory = goal.fundHistory || [];

  const handleEditGoal = async (data: { name: string; targetAmount: number; currentAmount: number; deadline: Date }) => {
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        data: {
          title: data.name,
          totalCost: data.targetAmount,
        },
      });
      setIsEditDialogOpen(false);
      toast({
        title: t('toast.goalUpdated'),
        description: `"${data.name}"`,
      });
    } catch {
      toast({
        title: t('common.error'),
        description: 'No se pudo actualizar la meta',
        variant: 'destructive',
      });
    }
  };

  const handleAddFunds = async (data: { amount: number; note?: string }) => {
    try {
      await addContribution.mutateAsync({
        goalId: goal.id,
        data: { amount: data.amount, note: data.note },
      });
      setIsAddFundsDialogOpen(false);
      toast({
        title: t('toast.fundsAdded'),
        description: `${formatAmount(data.amount)} → "${goal.name}"`,
      });
    } catch {
      toast({
        title: t('common.error'),
        description: 'No se pudo agregar fondos',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGoal = async () => {
    try {
      await deleteGoal.mutateAsync(goal.id);
      toast({
        title: t('toast.goalDeleted'),
        description: `"${goal.name}"`,
        variant: 'destructive',
      });
      navigate('/goals');
    } catch {
      toast({
        title: t('common.error'),
        description: 'No se pudo eliminar la meta',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/goals')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <Target className="h-6 w-6" style={{ color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{goal.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t('goalDetail.deadline')}: {formatDate(deadline)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isCompleted && (
            <Button onClick={() => setIsAddFundsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('goalDetail.addFunds')}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('goalDetail.edit')}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('goalDetail.delete')}
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{formatAmount(currentAmount)}</p>
                  <p className="text-muted-foreground">{t('goalDetail.ofTarget', { target: formatAmount(targetAmount) })}</p>
                </div>
                {isCompleted ? (
                  <Badge className="bg-success text-success-foreground">{t('goals.completed')}</Badge>
                ) : daysLeft <= 30 && daysLeft > 0 ? (
                  <Badge variant="secondary">{daysLeft} {t('goals.daysLeft')}</Badge>
                ) : null}
              </div>
              <Progress value={percentage} className="h-4" style={{ ['--progress-background' as string]: color }} />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{percentage.toFixed(1)}% {t('goals.complete')}</span>
                {!isCompleted && <span className="font-medium">{formatAmount(remaining)} restante</span>}
              </div>
            </div>
            <Separator orientation="vertical" className="hidden h-24 lg:block" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('goalDetail.created')}</p>
                <p className="font-medium">{formatDate(goal.createdAt || new Date().toISOString())}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('goalDetail.totalContributions')}</p>
                <p className="font-medium">{fundHistory.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fund History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('goalDetail.contributionHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fundHistory.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('goalDetail.noContributions')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('transactions.date')}</TableHead>
                  <TableHead>{t('transactions.amount')}</TableHead>
                  <TableHead>{t('goalDetail.note')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundHistory.slice().reverse().map((fund: FundHistory) => (
                  <TableRow key={fund.id}>
                    <TableCell className="font-medium">{formatDate(fund.date)}</TableCell>
                    <TableCell className="text-success font-semibold">+{formatAmount(fund.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{fund.note || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('goalDetail.editGoal')}</DialogTitle>
          </DialogHeader>
          <GoalForm
            onSubmit={handleEditGoal}
            onCancel={() => setIsEditDialogOpen(false)}
            defaultValues={{
              name: goal.name,
              targetAmount: targetAmount,
              currentAmount: currentAmount,
              deadline: deadlineDate,
            }}
            isEditing
          />
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('goalDetail.addFundsTo', { name: goal.name })}</DialogTitle>
          </DialogHeader>
          <AddFundsForm
            onSubmit={handleAddFunds}
            onCancel={() => setIsAddFundsDialogOpen(false)}
            maxAmount={remaining}
            isLoading={addContribution.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('goalDetail.deleteGoal')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('goalDetail.deleteConfirmation', { name: goal.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal}>
              {deleteGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GoalDetail;