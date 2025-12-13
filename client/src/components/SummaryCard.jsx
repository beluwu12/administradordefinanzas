import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function SummaryCard({ currency, amount, label = "Balance Total" }) {
    return (
        <div className="bg-surface p-5 rounded-lg border border-border">
            <div className="flex justify-between items-start mb-4">
                <div className="p-0">
                    <Wallet className="text-muted" size={20} />
                </div>
                <span className="text-xs font-medium bg-[#40414f] text-text px-2 py-0.5 rounded">
                    Active
                </span>
            </div>
            <p className="text-muted text-xs font-medium mb-1 uppercase tracking-wide">{label} ({currency})</p>
            <h3 className="text-2xl font-bold text-text">
                {formatCurrency(amount, currency)}
            </h3>
        </div>
    );
}
