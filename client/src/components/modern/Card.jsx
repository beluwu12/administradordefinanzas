import React from 'react';

/**
 * ModernCard - Clean white container with border and shadow
 * Matches the appuidesktop design system
 */
const Card = ({
    children,
    className = '',
    padding = 'p-5',
    interactive = false,
    ...props
}) => {
    const baseClasses = 'bg-bg-card border border-card-border rounded-xl shadow-sm';
    const interactiveClasses = interactive ? 'hover:shadow-md transition-shadow cursor-pointer' : '';

    return (
        <div
            className={`${baseClasses} ${interactiveClasses} ${padding} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
