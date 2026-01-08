import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-bold transition-all rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-pink-700 shadow-md shadow-primary/20',
        secondary: 'bg-gray-100 text-foreground hover:bg-gray-200',
        ghost: 'bg-transparent hover:bg-primary/5 text-primary',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-foreground',
        success: 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-500/20',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export function Button({ className, variant, size, children, icon, loading, ...props }) {
  return (
    <button 
      className={cn(buttonVariants({ variant, size }), className)} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export { buttonVariants };
