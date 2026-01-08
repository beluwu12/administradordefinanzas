import { cn } from '@/lib/utils';

export function Input({ className, icon, error, ...props }) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-gray-400 text-xl">{icon}</span>
        </div>
      )}
      <input
        className={cn(
          'w-full bg-white border rounded-xl text-foreground h-12',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          'placeholder-gray-400 transition-all',
          icon ? 'pl-10 pr-4' : 'px-4',
          error ? 'border-red-500' : 'border-gray-200',
          className
        )}
        {...props}
      />
    </div>
  );
}

export function InputLabel({ className, required, children, ...props }) {
  return (
    <label className={cn('text-gray-700 text-sm font-medium block mb-2', className)} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export function InputError({ className, children, ...props }) {
  if (!children) return null;
  return (
    <p className={cn('text-red-500 text-xs mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function Textarea({ className, error, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full bg-white border rounded-xl text-foreground p-4',
        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
        'placeholder-gray-400 transition-all resize-none text-sm',
        error ? 'border-red-500' : 'border-gray-200',
        className
      )}
      {...props}
    />
  );
}
