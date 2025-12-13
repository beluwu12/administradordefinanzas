import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { texts, formatCurrency } from '../../i18n/es';

import API_URL from '../../config';

const Summary30Days = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await axios.get(`${API_URL}/insight/summary`);
                setSummary(res.data);
            } catch (error) {
                console.error("Error loading summary", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div className="animate-pulse bg-surface h-48 rounded-2xl w-full"></div>;
    if (!summary) return null;

    const { totalIncome, totalExpense, netSavings, topExpenseTags } = summary;

    return (
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm mb-8">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                <Wallet size={24} className="text-primary" />
                {texts.dashboard.summary30Days}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Income */}
                <div className="flex flex-col p-4 bg-background/50 rounded-xl border border-[#ffffff05]">
                    <span className="text-textSecondary text-sm mb-1">{texts.dashboard.income}</span>
                    <div className="flex items-center gap-2 text-green-400">
                        <TrendingUp size={20} />
                        <span className="text-xl font-bold">{formatCurrency(totalIncome.USD || 0, 'USD')}</span>
                    </div>
                    {totalIncome.VES > 0 && (
                        <span className="text-xs text-textSecondary mt-1 ml-7">{formatCurrency(totalIncome.VES, 'VES')}</span>
                    )}
                </div>

                {/* Expense */}
                <div className="flex flex-col p-4 bg-background/50 rounded-xl border border-[#ffffff05]">
                    <span className="text-textSecondary text-sm mb-1">{texts.dashboard.expense}</span>
                    <div className="flex items-center gap-2 text-red-400">
                        <TrendingDown size={20} />
                        <span className="text-xl font-bold">{formatCurrency(totalExpense.USD || 0, 'USD')}</span>
                    </div>
                    {totalExpense.VES > 0 && (
                        <span className="text-xs text-textSecondary mt-1 ml-7">{formatCurrency(totalExpense.VES, 'VES')}</span>
                    )}
                </div>

                {/* Net Savings */}
                <div className="flex flex-col p-4 bg-background/50 rounded-xl border border-[#ffffff05]">
                    <span className="text-textSecondary text-sm mb-1">{texts.dashboard.netSavings}</span>
                    <div className={`flex items-center gap-2 ${netSavings.USD >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                        <Wallet size={20} />
                        <span className="text-xl font-bold">{formatCurrency(netSavings.USD || 0, 'USD')}</span>
                    </div>
                </div>
            </div>

            {/* Top Expenses */}
            {topExpenseTags.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-textSecondary mb-3">{texts.dashboard.topExpenses}</h3>
                    <div className="space-y-3">
                        {topExpenseTags.map((tag, idx) => (
                            <div key={idx} className="flex items-center justify-between pb-2 border-b border-[#ffffff05] last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-text font-medium">{tag.name}</span>
                                    <span className="text-xs text-textSecondary px-2 py-0.5 bg-background rounded-full">{tag.count} txs</span>
                                </div>
                                <span className="text-text font-bold">{formatCurrency(tag.totalUSD || 0, 'USD')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Summary30Days;
