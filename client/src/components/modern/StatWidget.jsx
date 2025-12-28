import React from 'react';

/**
 * StatWidget - Dashboard number display with trend indicator
 * Matches the appuidesktop design system
 */
const StatWidget = ({
    label,
    value,
    trend,
    trendValue,
    icon,
    showVisibilityToggle = false,
    onToggleVisibility,
    className = '',
}) => {
    return (
        <div className={`bg-bg-card border border-card-border rounded-xl p-5 relative overflow-hidden group shadow-sm ${className}`}>
            {/* Gradient overlay */}
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>

            <div className="flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-text-muted font-medium mb-1 flex items-center gap-2">
                            {label}
                            {showVisibilityToggle && (
                                <span
                                    className="material-symbols-outlined text-text-muted text-sm cursor-pointer hover:text-text-main"
                                    title="Alternar Privacidad"
                                    onClick={onToggleVisibility}
                                >
                                    visibility
                                </span>
                            )}
                        </p>
                        <h2 className="text-3xl font-bold text-text-main tracking-tight">{value}</h2>
                    </div>

                    {trend && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${trend === 'up' ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-600'
                            }`}>
                            <span className="material-symbols-outlined text-sm">
                                {trend === 'up' ? 'trending_up' : 'trending_down'}
                            </span>
                            {trendValue}
                        </span>
                    )}
                </div>

                {/* Mini bar chart */}
                <div className="flex items-end gap-1 h-10 w-full mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-full bg-primary/20 rounded-t-sm h-[40%]"></div>
                    <div className="w-full bg-primary/30 rounded-t-sm h-[50%]"></div>
                    <div className="w-full bg-primary/20 rounded-t-sm h-[45%]"></div>
                    <div className="w-full bg-primary/40 rounded-t-sm h-[60%]"></div>
                    <div className="w-full bg-primary/30 rounded-t-sm h-[55%]"></div>
                    <div className="w-full bg-primary/60 rounded-t-sm h-[75%]"></div>
                    <div className="w-full bg-primary/40 rounded-t-sm h-[70%]"></div>
                    <div className="w-full bg-primary/80 rounded-t-sm h-[85%]"></div>
                    <div className="w-full bg-primary/60 rounded-t-sm h-[80%]"></div>
                    <div className="w-full bg-primary rounded-t-sm h-[100%]"></div>
                </div>
            </div>
        </div>
    );
};

export default StatWidget;
