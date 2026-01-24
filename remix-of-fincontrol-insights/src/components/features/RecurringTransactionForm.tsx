import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/lib/api/hooks';

// Define types locally since they're not coming from mockData anymore
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  nextDate: string;
  isActive: boolean;
}

const frequencyOptions: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
];

const recurringSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0').max(1000000, 'Monto muy grande'),
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().trim().min(1, 'La descripción es requerida').max(100, 'Descripción muy larga'),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
  startDate: z.date({ required_error: 'La fecha de inicio es requerida' }),
});

export type RecurringFormValues = z.infer<typeof recurringSchema>;

interface RecurringTransactionFormProps {
  recurring?: RecurringTransaction;
  onSubmit: (data: RecurringFormValues) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const RecurringTransactionForm = ({
  recurring,
  onSubmit,
  onCancel,
  isEditing = false,
}: RecurringTransactionFormProps) => {
  const { getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();

  // API hook for categories
  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];
  const categoryNames = categories.map(c => c.name);

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: recurring?.type || 'expense',
      amount: recurring?.amount || 0,
      category: recurring?.category || '',
      description: recurring?.description || '',
      frequency: recurring?.frequency || 'monthly',
      startDate: recurring?.startDate ? new Date(recurring.startDate) : new Date(),
    },
  });

  const handleSubmit = (data: RecurringFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.type')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactions.selectType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income">{t('transactions.income')}</SelectItem>
                  <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.amount')} ({getCurrencySymbol()})</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('recurring.frequency')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('recurring.selectFrequency')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.category')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('transactions.selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryNames.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.description')}</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Suscripción Netflix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('recurring.startDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : t('common.pickDate')}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            {isEditing ? t('common.update') : t('recurring.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RecurringTransactionForm;
