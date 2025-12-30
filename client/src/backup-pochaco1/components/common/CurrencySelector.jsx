/**
 * CurrencySelector Component
 * Updated styling for pink theme template
 */

import React from 'react';

export default function CurrencySelector({
    value,
    onChange,
    currencies,
    isDualCurrency,
    defaultCurrency
}) {
    if (!isDualCurrency) {
        // Single currency display (read-only)
        return (
            <div className="w-full h-12 pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-foreground flex items-center relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-xl">payments</span>
                </div>
                <span className="pl-7">{defaultCurrency}</span>
            </div>
        );
    }

    // Dual currency selector
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 text-xl">payments</span>
            </div>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-12 appearance-none cursor-pointer"
            >
                {currencies.map(curr => (
                    <option key={curr} value={curr}>
                        {curr === 'VES' ? 'VES (Bs.)' : `${curr} ($)`}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400">expand_more</span>
            </div>
        </div>
    );
}
