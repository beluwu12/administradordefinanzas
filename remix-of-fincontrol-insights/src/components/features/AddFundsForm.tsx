import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

const addFundsSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0').max(1000000, 'Amount too large'),
  note: z.string().trim().max(200, 'Note must be less than 200 characters').optional(),
});

type AddFundsFormValues = z.infer<typeof addFundsSchema>;

interface AddFundsFormProps {
  onSubmit: (data: AddFundsFormValues) => void;
  onCancel: () => void;
  maxAmount?: number;
  isLoading?: boolean;
}

const AddFundsForm = ({ onSubmit, onCancel, maxAmount, isLoading = false }: AddFundsFormProps) => {
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  const form = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: 0,
      note: '',
    },
  });

  const handleSubmit = (data: AddFundsFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({getCurrencySymbol()})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  {...field}
                />
              </FormControl>
              {maxAmount !== undefined && maxAmount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Remaining to goal: {formatAmount(maxAmount)}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Monthly savings contribution"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('goals.addFunds')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddFundsForm;
