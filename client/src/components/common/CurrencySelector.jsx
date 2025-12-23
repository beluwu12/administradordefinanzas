/**
 * CurrencySelector Component
 * Extracted from TransactionForm for SRP compliance
 * Handles currency selection for dual/single currency countries
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
            <div className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text">
                {defaultCurrency}
            </div>
        );
    }

    // Dual currency selector
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
            {currencies.map(curr => (
                <option key={curr} value={curr}>
                    {curr === 'VES' ? 'VES (Bs.)' : `${curr} ($)`}
                </option>
            ))}
        </select>
    );
}
