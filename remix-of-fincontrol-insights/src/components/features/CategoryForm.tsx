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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(30, 'Name must be less than 30 characters'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  onSubmit: (data: CategoryFormValues) => void;
  onCancel: () => void;
  defaultValues?: Partial<CategoryFormValues>;
  isEditing?: boolean;
}

const iconOptions = [
  { value: '🍔', label: 'Food 🍔' },
  { value: '💡', label: 'Utilities 💡' },
  { value: '🎬', label: 'Entertainment 🎬' },
  { value: '🚗', label: 'Transportation 🚗' },
  { value: '🛍️', label: 'Shopping 🛍️' },
  { value: '💪', label: 'Health 💪' },
  { value: '💰', label: 'Money 💰' },
  { value: '💼', label: 'Work 💼' },
  { value: '📈', label: 'Investments 📈' },
  { value: '🏠', label: 'Home 🏠' },
  { value: '✈️', label: 'Travel ✈️' },
  { value: '📚', label: 'Education 📚' },
  { value: '🎁', label: 'Gifts 🎁' },
  { value: '🐾', label: 'Pets 🐾' },
];

const colorOptions = [
  { value: 'hsl(330, 90%, 46%)', label: 'Pink', class: 'bg-primary' },
  { value: 'hsl(173, 58%, 39%)', label: 'Teal', class: 'bg-[hsl(173,58%,39%)]' },
  { value: 'hsl(197, 37%, 24%)', label: 'Blue Gray', class: 'bg-[hsl(197,37%,24%)]' },
  { value: 'hsl(43, 74%, 66%)', label: 'Yellow', class: 'bg-[hsl(43,74%,66%)]' },
  { value: 'hsl(27, 87%, 67%)', label: 'Orange', class: 'bg-[hsl(27,87%,67%)]' },
  { value: 'hsl(280, 65%, 60%)', label: 'Purple', class: 'bg-[hsl(280,65%,60%)]' },
  { value: 'hsl(142, 76%, 36%)', label: 'Green', class: 'bg-[hsl(142,76%,36%)]' },
  { value: 'hsl(200, 70%, 50%)', label: 'Blue', class: 'bg-[hsl(200,70%,50%)]' },
];

const CategoryForm = ({ onSubmit, onCancel, defaultValues, isEditing = false }: CategoryFormProps) => {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name || '',
      icon: defaultValues?.icon || '',
      color: defaultValues?.color || '',
    },
  });

  const handleSubmit = (data: CategoryFormValues) => {
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
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
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
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-4 w-4 rounded-full" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Choose a color to identify this category</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
