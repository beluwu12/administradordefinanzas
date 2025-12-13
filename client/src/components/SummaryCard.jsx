import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function SummaryCard({ currency, amount, label = "Balance Total", icon: Icon, className = "" }) {
    return (
        <div className={`p-4 md:p-5 rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 group overflow-hidden ${className || 'bg-surface'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-background/50 rounded-xl group-hover:bg-primary/20 transition-colors">
                    {Icon ? <Icon className="text-muted group-hover:text-primary transition-colors" size={20} /> : <Wallet className="text-muted group-hover:text-primary transition-colors" size={20} />}
                </div>
            </div>
            <p className="text-muted text-[10px] md:text-xs font-bold mb-1 uppercase tracking-wider group-hover:text-text transition-colors truncate">{label} ({currency})</p>
            <h3 className="text-lg md:text-2xl lg:text-3xl font-extrabold text-text tracking-tight group-hover:text-primary transition-colors truncate">
                {formatCurrency(amount, currency)}
            </h3>
        </div>
    );
}
