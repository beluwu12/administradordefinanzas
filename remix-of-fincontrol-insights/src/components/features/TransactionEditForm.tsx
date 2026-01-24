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
import type { Transaction, Category } from '@/lib/api/types';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0').max(1000000, 'Amount too large'),
  currency: z.enum(['USD', 'VES']).default('USD'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().trim().min(1, 'Description is required').max(100, 'Description too long'),
  date: z.date({ required_error: 'Date is required' }),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionEditFormProps {
  transaction?: Transaction;
  onSubmit: (data: TransactionFormValues) => void;
  onCancel: () => void;
  categories?: Category[];
  isEditing?: boolean;
}

const TransactionEditForm = ({
  transaction,
  onSubmit,
  onCancel,
  categories = [],
  isEditing = false,
}: TransactionEditFormProps) => {
  const { getCurrencySymbol, currency: userCurrency } = useCurrency();
  const { t } = useLanguage();

  // Dual currency mode is enabled for VES users
  const isDualCurrency = userCurrency === 'VES';

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: (transaction?.type?.toLowerCase() as 'income' | 'expense') || 'expense',
      amount: transaction?.amount || 0,
      currency: (transaction?.currency as 'USD' | 'VES') || 'USD',
      category: transaction?.category || '',
      description: transaction?.description || '',
      date: transaction?.date ? new Date(transaction.date) : new Date(),
    },
  });

  const selectedCurrency = form.watch('currency');

  const handleSubmit = (data: TransactionFormValues) => {
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

        {/* Currency selector - only shown for VES users */}
        {isDualCurrency && (
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('transactions.currency')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('transactions.selectCurrency')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="VES">VES (Bs.)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.amount')} ({selectedCurrency === 'VES' ? 'Bs.' : '$'})</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.description')}</FormLabel>
              <FormControl>
                <Input placeholder={t('transactions.descriptionPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('transactions.date')}</FormLabel>
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
                      {field.value ? format(field.value, 'PPP') : t('transactions.pickDate')}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
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
            {isEditing ? t('transactions.updateTransaction') : t('transactions.addTransaction')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TransactionEditForm;
