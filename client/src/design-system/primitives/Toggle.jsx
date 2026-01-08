import { cn } from '@/lib/utils';

export function Toggle({ options, value, onChange, className, ...props }) {
  return (
    <div className={cn('flex p-1 rounded-xl bg-gray-50 border border-gray-200', className)} {...props}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
            value === option.value
              ? option.activeClass || 'bg-primary text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {option.icon && (
            <span className="material-symbols-outlined mr-2 text-[18px]">{option.icon}</span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Pre-configured Income/Expense toggle
export function TransactionTypeToggle({ value, onChange, className }) {
  return (
    <Toggle
      className={className}
      value={value}
      onChange={onChange}
      options={[
        { value: 'INCOME', label: 'Ingreso', icon: 'arrow_downward', activeClass: 'bg-green-500 text-white shadow-sm' },
        { value: 'EXPENSE', label: 'Gasto', icon: 'arrow_upward', activeClass: 'bg-primary text-white shadow-sm' },
      ]}
    />
  );
}
