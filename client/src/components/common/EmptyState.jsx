import React from 'react';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fadeIn">
            <div className="bg-surface border border-border p-6 rounded-full mb-4 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded-full" />
                <Icon size={48} className="text-muted group-hover:text-primary transition-colors relative z-10" strokeWidth={1.5} />
            </div>

            <h3 className="text-lg font-bold text-text mb-2 tracking-tight">{title}</h3>

            {description && (
                <p className="text-muted text-sm max-w-xs mx-auto mb-6 leading-relaxed">
                    {description}
                </p>
            )}

            {action && actionLabel && (
                <button
                    onClick={action}
                    className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
