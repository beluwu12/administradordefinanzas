import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/lib/api/hooks';

interface SplitItem {
  id: string;
  category: string;
  amount: number;
}

interface TransactionSplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    description: string;
    amount: number;
    category: string;
  } | null;
  onSplit: (transactionId: string, splits: { category: string; amount: number }[]) => void;
}

const TransactionSplitDialog = ({ open, onOpenChange, transaction, onSplit }: TransactionSplitDialogProps) => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const { toast } = useToast();

  // API hook for categories
  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];
  const categoryNames = categories.map(c => c.name);

  const [splits, setSplits] = useState<SplitItem[]>([]);

  // Reset splits when transaction changes
  useEffect(() => {
    if (transaction && open) {
      setSplits([{
        id: '1',
        category: transaction.category,
        amount: transaction.amount,
      }]);
    }
  }, [transaction, open]);

  if (!transaction) return null;

  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  const remaining = transaction.amount - totalSplit;
  const isValid = Math.abs(remaining) < 0.01;
  const progressPercentage = (totalSplit / transaction.amount) * 100;

  const addSplit = () => {
    setSplits(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        category: categoryNames[0] || 'Otros',
        amount: remaining > 0 ? remaining : 0,
      }
    ]);
  };

  const removeSplit = (id: string) => {
    if (splits.length <= 1) return;
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const updateSplit = (id: string, field: 'category' | 'amount', value: string | number) => {
    setSplits(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = () => {
    if (!isValid) {
      toast({
        title: t('common.error'),
        description: 'Los montos divididos deben ser igual al total de la transacción.',
        variant: 'destructive',
      });
      return;
    }

    onSplit(transaction.id, splits.map(s => ({
      category: s.category,
      amount: s.amount,
    })));
    onOpenChange(false);
    toast({
      title: t('common.success'),
      description: 'Transacción dividida exitosamente.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('transactions.splitTransaction')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction info */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="font-medium">{transaction.description}</p>
            <p className="text-lg font-bold text-destructive">
              {formatAmount(transaction.amount)}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('transactions.totalSplit')}: {formatAmount(totalSplit)}</span>
              <span className={remaining > 0 ? 'text-destructive' : remaining < 0 ? 'text-destructive' : 'text-success'}>
                {t('transactions.remaining')}: {formatAmount(remaining)}
              </span>
            </div>
            <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
          </div>

          {/* Split items */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {splits.map((split) => (
              <div key={split.id} className="flex items-end gap-2 animate-fade-in">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{t('transactions.category')}</Label>
                  <Select
                    value={split.category}
                    onValueChange={(val) => updateSplit(split.id, 'category', val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryNames.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-28 space-y-1.5">
                  <Label className="text-xs">{t('transactions.amount')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={split.amount}
                    onChange={(e) => updateSplit(split.id, 'amount', parseFloat(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>

                {splits.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => removeSplit(split.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSplit}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('transactions.addSplit')}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionSplitDialog;
