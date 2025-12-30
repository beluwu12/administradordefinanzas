import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { cn } from '@/lib/utils';

export default function SummaryCard({ currency, amount, label = "Balance Total", icon: Icon, className = "" }) {
    const isNegative = amount < 0;

    return (
        <div className={cn(
            "p-5 rounded-lg bg-card border border-border shadow-sm",
            "transition-all duration-200 hover:shadow-md",
            isNegative && "border-red-200",
            className
        )}>
            <div className="flex justify-between items-start mb-3">
                <div className={cn("p-2 rounded-lg", isNegative ? "bg-red-50" : "bg-blue-50")}>
                    {Icon ? <Icon className={isNegative ? "text-red-500" : "text-primary"} size={20} /> : <Wallet className={isNegative ? "text-red-500" : "text-primary"} size={20} />}
                </div>
            </div>
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">{label} ({currency})</p>
            <h3 className={cn(
                "text-3xl font-bold tracking-tight",
                isNegative ? "text-red-500" : "text-primary"
            )}>
                {formatCurrency(amount, currency)}
            </h3>
        </div>
    );
}


