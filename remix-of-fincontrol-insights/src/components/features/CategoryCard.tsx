import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CategoryCardProps {
  name: string;
  color: string;
  transactionCount: number;
  totalSpent: number;
  icon?: React.ReactNode;
  onEdit?: (name: string) => void;
  onDelete?: (name: string) => void;
  onView?: (name: string) => void;
}

const CategoryCard = ({ 
  name, 
  color, 
  transactionCount, 
  totalSpent,
  icon,
  onEdit,
  onDelete,
  onView 
}: CategoryCardProps) => {
  const { formatAmount } = useCurrency();

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon || (
                <div 
                  className="h-4 w-4 rounded-full" 
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
            <div>
              <h3 className="font-medium">{name}</h3>
              <p className="text-sm text-muted-foreground">
                {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatAmount(totalSpent)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(name)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(name)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(name)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
