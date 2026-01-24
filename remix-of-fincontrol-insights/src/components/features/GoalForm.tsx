import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

const goalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(50, 'Name must be less than 50 characters'),
  targetAmount: z.coerce.number().min(1, 'Target must be at least 1').max(100000000, 'Target too large'),
  currentAmount: z.coerce.number().min(0, 'Current amount cannot be negative'),
  deadline: z.date({ required_error: 'Deadline is required' }),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalFormProps {
  onSubmit: (data: GoalFormValues) => void;
  onCancel: () => void;
  defaultValues?: Partial<GoalFormValues>;
  isEditing?: boolean;
}

const GoalForm = ({ onSubmit, onCancel, defaultValues, isEditing = false }: GoalFormProps) => {
  const { getCurrencySymbol } = useCurrency();
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      targetAmount: defaultValues?.targetAmount || 0,
      currentAmount: defaultValues?.currentAmount || 0,
      deadline: defaultValues?.deadline || undefined,
    },
  });

  const handleSubmit = (data: GoalFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Emergency Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount ({getCurrencySymbol()})</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEditing && (
          <FormField
            control={form.control}
            name="currentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Amount ({getCurrencySymbol()})</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Deadline</FormLabel>
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
                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
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
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GoalForm;
