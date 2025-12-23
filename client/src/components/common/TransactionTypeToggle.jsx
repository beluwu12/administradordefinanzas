/**
 * TransactionTypeToggle Component
 * Extracted from TransactionForm for SRP compliance
 * Handles INCOME/EXPENSE type selection
 */

import React from 'react';
import { texts } from '../../i18n/es';

export default function TransactionTypeToggle({ value, onChange }) {
    return (
        <div
            className="grid grid-cols-2 gap-2 bg-background p-1 rounded-lg border border-border"
            role="radiogroup"
            aria-label="Tipo de transacción"
        >
            <button
                type="button"
                role="radio"
                aria-checked={value === 'INCOME'}
                onClick={() => onChange('INCOME')}
                className={`py-2 rounded-md text-sm font-medium transition-all ${value === 'INCOME'
                        ? 'bg-secondary/20 text-secondary'
                        : 'text-muted hover:text-text'
                    }`}
            >
                {texts.transactions.income}
            </button>
            <button
                type="button"
                role="radio"
                aria-checked={value === 'EXPENSE'}
                onClick={() => onChange('EXPENSE')}
                className={`py-2 rounded-md text-sm font-medium transition-all ${value === 'EXPENSE'
                        ? 'bg-danger/20 text-danger'
                        : 'text-muted hover:text-text'
                    }`}
            >
                {texts.transactions.expense}
            </button>
        </div>
    );
}
