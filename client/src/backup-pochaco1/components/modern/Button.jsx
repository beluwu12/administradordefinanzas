import React from 'react';

/**
 * ModernButton - Primary green buttons, secondary slate buttons
 * Matches the appuidesktop design system
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconOnly = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold transition-all rounded-lg';

    const variants = {
        primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-green-200',
        secondary: 'bg-slate-100 text-text-main hover:bg-slate-200',
        ghost: 'text-text-muted hover:text-text-main hover:bg-slate-50',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-dashed border-gray-300 text-text-muted hover:text-text-main hover:border-gray-400',
    };

    const sizes = {
        sm: iconOnly ? 'w-7 h-7' : 'h-8 px-3 text-xs',
        md: iconOnly ? 'w-10 h-10' : 'h-10 px-4 text-sm',
        lg: iconOnly ? 'w-12 h-12' : 'h-12 px-6 text-base',
    };

    const iconOnlyClasses = iconOnly ? 'rounded-full' : '';

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${iconOnlyClasses} ${className}`}
            {...props}
        >
            {icon && (
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
            )}
            {!iconOnly && children}
        </button>
    );
};

export default Button;
