import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Transaction } from '@/lib/api/types';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TransactionRow = ({ transaction, onEdit, onDelete }: TransactionRowProps) => {
  const { formatAmount } = useCurrency();
  const isIncome = transaction.type?.toUpperCase() === 'INCOME';

  return (
    <TableRow>
      <TableCell className="font-medium">
        {formatDate(transaction.date)}
      </TableCell>
      <TableCell>{transaction.description}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-normal">
          {transaction.category}
        </Badge>
      </TableCell>
      <TableCell
        className={cn(
          'text-right font-semibold',
          isIncome ? 'text-success' : 'text-destructive'
        )}
      >
        {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Transaction actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(transaction.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(transaction.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default TransactionRow;
