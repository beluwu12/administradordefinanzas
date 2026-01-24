import { ReactNode } from 'react';
import { FileText, Target, Wallet, Tag, Receipt, RefreshCw, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'transactions' | 'goals' | 'budgets' | 'categories' | 'recurring' | 'search' | 'custom';
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const emptyStateConfig: Record<string, { icon: LucideIcon; gradient: string }> = {
  transactions: { 
    icon: Receipt, 
    gradient: 'from-primary/20 via-primary/10 to-transparent'
  },
  goals: { 
    icon: Target, 
    gradient: 'from-success/20 via-success/10 to-transparent'
  },
  budgets: { 
    icon: Wallet, 
    gradient: 'from-chart-1/20 via-chart-1/10 to-transparent'
  },
  categories: { 
    icon: Tag, 
    gradient: 'from-chart-2/20 via-chart-2/10 to-transparent'
  },
  recurring: { 
    icon: RefreshCw, 
    gradient: 'from-chart-3/20 via-chart-3/10 to-transparent'
  },
  search: { 
    icon: FileText, 
    gradient: 'from-muted/50 via-muted/30 to-transparent'
  },
  custom: { 
    icon: FileText, 
    gradient: 'from-primary/20 via-primary/10 to-transparent'
  },
};

const EmptyState = ({ 
  type, 
  title, 
  description, 
  icon: CustomIcon, 
  action,
  className 
}: EmptyStateProps) => {
  const config = emptyStateConfig[type] || emptyStateConfig.custom;
  const Icon = CustomIcon || config.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in",
      className
    )}>
      {/* Decorative background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-radial opacity-50 pointer-events-none",
        config.gradient
      )} />
      
      {/* Icon with animated ring */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse" 
             style={{ transform: 'scale(1.5)' }} />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 shadow-lg">
          <Icon className="h-10 w-10 text-muted-foreground/70" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="absolute -bottom-1 -left-3 h-2 w-2 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="absolute top-1/2 -right-4 h-2 w-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      )}

      {/* Action button */}
      {action && (
        <Button onClick={action.onClick} className="shadow-md hover:shadow-lg transition-shadow">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
