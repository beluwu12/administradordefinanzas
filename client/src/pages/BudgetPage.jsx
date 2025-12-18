import React, { useEffect, useState } from 'react';
import api from '../api';
import { PiggyBank, Calendar, Trash2, Plus, AlertCircle, TrendingUp } from 'lucide-react';
import { texts, formatCurrency } from '../i18n/es';

export default function BudgetPage() {
    const [insight, setInsight] = useState(null);
    const [fixedExpenses, setFixedExpenses] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState({
        description: '',
        amount: '',
        currency: 'USD',
        startDate: (() => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 10);
        })(),
        dueDay: '' // Fallback/Optional if we wanted manual override
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [summaryRes, listRes, balanceRes] = await Promise.all([
                api.get('/insight/summary').catch(() => ({ data: null })),
                api.get('/fixed-expenses'),
                api.get('/transactions/balance')
            ]);

            // Build insight from summary data
            if (summaryRes.data) {
                setInsight({
                    recentMonthlyIncome: summaryRes.data.totalIncome || { USD: 0, VES: 0 },
                    netSavings: summaryRes.data.netSavings || { USD: 0, VES: 0 }
                });
            }
            setFixedExpenses(listRes.data || []);
            setExchangeRate(balanceRes.data?.exchangeRate || null);
        } catch (error) {
            console.error("Error loading budget data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            // Extract dueDay from startDate (day of month)
            const dateObj = new Date(newItem.startDate + 'T12:00:00');
            const dueDay = dateObj.getDate();

            const payload = {
                description: newItem.description,
                amount: newItem.amount,
                currency: newItem.currency,
                dueDay: dueDay
            };

            await api.post('/fixed-expenses', payload);
            // Reset and reload
            setNewItem({
                description: '',
                amount: '',
                currency: 'USD',
                startDate: (() => {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                    return now.toISOString().slice(0, 10);
                })(),
                dueDay: ''
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error("FULL ERROR:", error);
            alert(error.message || texts.common.error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este gasto fijo?')) return;
        try {
            await api.delete(`/fixed-expenses/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">{texts.app.loading}</div>;

    // Calculate insight for both currencies
    const monthlyIncomeUSD = insight?.recentMonthlyIncome?.USD || 0;
    const monthlyIncomeVES = insight?.recentMonthlyIncome?.VES || 0;

    // Calculate fixed costs from the list if insight is not available
    const fixedCostUSD = fixedExpenses.filter(e => e.currency === 'USD').reduce((sum, e) => sum + e.amount, 0);
    const fixedCostVES = fixedExpenses.filter(e => e.currency === 'VES').reduce((sum, e) => sum + e.amount, 0);

    // Calculate total fixed cost in USD (converting VES if needed)
    const fixedCostTotalUSD = fixedCostUSD + (exchangeRate ? fixedCostVES / exchangeRate : 0);

    const disposableUSD = monthlyIncomeUSD - fixedCostTotalUSD;
    const savingsTarget = disposableUSD * 0.2; // Example 20% savings rule

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="text-2xl font-bold text-text">{texts.budget.title}</h2>
                <p className="text-muted">{texts.budget.insightTitle}</p>
            </div>

            {/* Insight Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-surface p-4 rounded-lg border border-border">
                    <h3 className="text-muted text-xs font-bold uppercase mb-2">{texts.budget.incomeAvg}</h3>
                    <p className="text-xl font-bold text-text truncate">{formatCurrency(monthlyIncomeUSD, 'USD')}</p>
                </div>

                <div className="bg-surface p-4 rounded-lg border border-border">
                    <h3 className="text-muted text-xs font-bold uppercase mb-2">{texts.budget.fixedTotal} (USD)</h3>
                    <p className="text-xl font-bold text-text truncate">{formatCurrency(fixedCostUSD, 'USD')}</p>
                    <p className="text-xs text-muted">{texts.budget.monthly || "Mensual"}</p>
                </div>

                <div className="bg-surface p-4 rounded-lg border border-border">
                    <h3 className="text-muted text-xs font-bold uppercase mb-2">{texts.budget.fixedTotal} (VES)</h3>
                    <p className="text-xl font-bold text-text truncate">{formatCurrency(fixedCostVES, 'VES')}</p>
                    <p className="text-xs text-muted">{texts.budget.monthly || "Mensual"}</p>
                </div>

                <div className="bg-surface p-4 rounded-lg border border-border">
                    <h3 className="text-muted text-xs font-bold uppercase mb-2">{texts.budget.quincenaTitle}</h3>
                    <p className="text-xl font-bold text-text mb-1 truncate">{formatCurrency(fixedCostUSD / 2, 'USD')}</p>
                    <p className="text-xs text-muted mb-1">50% de gastos fijos</p>
                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${monthlyIncomeUSD >= fixedCostUSD
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                        {texts.budget.collected}: {formatCurrency(monthlyIncomeUSD, 'USD')}
                    </div>
                </div>

                <div className={`p-4 rounded-lg border border-border ${disposableUSD >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <h3 className={`${disposableUSD >= 0 ? 'text-primary' : 'text-danger'} text-xs font-bold uppercase mb-2`}>{texts.budget.disposable}</h3>
                    <p className={`text-xl font-bold ${disposableUSD >= 0 ? 'text-text' : 'text-danger'} mb-1 truncate`}>
                        {formatCurrency(disposableUSD, 'USD')}
                    </p>
                    <p className="text-xs text-muted truncate">
                        20% Sugerido: <strong className={disposableUSD >= 0 ? 'text-primary' : 'text-danger'}>{formatCurrency(savingsTarget, 'USD')}</strong>
                    </p>
                </div>
            </div>

            {/* Fixed Expenses List */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="p-5 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-text flex items-center gap-2">
                        <Calendar size={20} className="text-muted" />
                        {texts.budget.fixedExpenses}
                    </h3>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="text-sm bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary-hover transition-colors flex items-center gap-1"
                    >
                        <Plus size={16} /> {texts.budget.addFixed}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleAddExpense} className="p-5 bg-background border-b border-border grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-muted mb-1">{texts.transactions.description}</label>
                            <input
                                type="text" required
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text"
                                placeholder={texts.transactions.descriptionPlaceholder}
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-muted mb-1">Moneda</label>
                            <select
                                value={newItem.currency}
                                onChange={e => setNewItem({ ...newItem, currency: e.target.value })}
                                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text"
                            >
                                <option value="USD">USD</option>
                                <option value="VES">VES</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-muted mb-1">{texts.transactions.amount}</label>
                            <input
                                type="number" step="0.01" required
                                value={newItem.amount}
                                onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-muted mb-1">{texts.transactions.date}</label>
                            <input
                                type="date" required
                                value={newItem.startDate}
                                onChange={e => setNewItem({ ...newItem, startDate: e.target.value })}
                                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text"
                            />
                        </div>
                        <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm h-10 font-bold">
                            {texts.transactions.save}
                        </button>
                    </form>
                )}

                <div className="p-0">
                    {fixedExpenses.length === 0 ? (
                        <div className="p-8 text-center text-muted">
                            {texts.tags.noTags ? "No hay gastos fijos" : "No hay gastos fijos"}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {fixedExpenses.map(expense => (
                                <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-background/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-background rounded-md flex flex-col items-center justify-center border border-border">
                                            <span className="text-[10px] text-primary font-bold uppercase">{texts.budget.day}</span>
                                            <span className="text-lg font-bold text-text leading-none">{expense.dueDay}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-text">{expense.description}</p>
                                            <p className="text-xs text-muted">{expense.currency} - {texts.budget.day} {expense.dueDay}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-bold text-text">
                                            {formatCurrency(expense.amount, expense.currency)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="text-muted hover:text-danger transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
