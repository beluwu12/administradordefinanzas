import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { cn } from '@/lib/utils';

export default function SummaryCard({ currency, amount, label = "Balance Total", icon: Icon, className = "" }) {
    return (
        <div className={cn(
            "p-5 rounded-lg bg-card border border-border shadow-sm",
            "transition-all duration-200 hover:shadow-md",
            className
        )}>
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    {Icon ? <Icon className="text-primary" size={20} /> : <Wallet className="text-primary" size={20} />}
                </div>
            </div>
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">{label} ({currency})</p>
            <h3 className="text-3xl font-bold text-primary tracking-tight">
                {formatCurrency(amount, currency)}
            </h3>
        </div>
    );
}

