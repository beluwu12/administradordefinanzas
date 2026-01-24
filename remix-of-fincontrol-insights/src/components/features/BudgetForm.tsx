import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Category } from '@/lib/api/types';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.coerce.number().min(1, 'Budget limit must be at least 1').max(10000000, 'Budget limit too large'),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  onSubmit: (data: BudgetFormValues) => void;
  onCancel: () => void;
  defaultValues?: Partial<BudgetFormValues>;
  categories?: Category[];
  isEditing?: boolean;
}

const BudgetForm = ({ onSubmit, onCancel, defaultValues, categories = [], isEditing = false }: BudgetFormProps) => {
  const { getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: defaultValues?.category || '',
      limit: defaultValues?.limit || 0,
    },
  });

  const handleSubmit = (data: BudgetFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.category')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactions.selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('budget.monthlyLimit')} ({getCurrencySymbol()})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            {isEditing ? t('budget.updateBudget') : t('budget.createBudget')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BudgetForm;
