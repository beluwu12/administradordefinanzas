import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function SummaryCard({ currency, amount, label = "Balance Total", icon: Icon, className = "" }) {
    return (
        <div className={`p-5 rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 group ${className || 'bg-surface'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-background/50 rounded-xl group-hover:bg-primary/20 transition-colors">
                    {Icon ? <Icon className="text-muted group-hover:text-primary transition-colors" size={24} /> : <Wallet className="text-muted group-hover:text-primary transition-colors" size={24} />}
                </div>
                {/* Optional Status Pill */}
                {/* <span className="text-[10px] font-bold bg-background/50 text-muted px-2 py-1 rounded-full uppercase tracking-wider">
                    Active
                </span> */}
            </div>
            <p className="text-muted text-xs font-bold mb-1 uppercase tracking-wider group-hover:text-text transition-colors">{label} ({currency})</p>
            <h3 className="text-3xl font-extrabold text-text tracking-tight group-hover:text-primary transition-colors">
                {formatCurrency(amount, currency)}
            </h3>
        </div>
    );
}
