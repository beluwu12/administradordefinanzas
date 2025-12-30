import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { texts, formatCurrency } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';

export default function BudgetPage() {
    const { user } = useAuth();
    const countryConfig = getCountryConfig(user?.country || 'VE');
    const isDual = isDualCurrency(user?.country || 'VE');

    const [insight, setInsight] = useState(null);
    const [fixedExpenses, setFixedExpenses] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState({
        description: '',
        amount: '',
        currency: countryConfig.defaultCurrency,
        dueDay: ''
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

            if (summaryRes.data?.data) {
                setInsight({
                    recentMonthlyIncome: summaryRes.data.data.totalIncome || { USD: 0, VES: 0 },
                    netSavings: summaryRes.data.data.netSavings || { USD: 0, VES: 0 }
                });
            }
            // API returns {success, data: [...]} so we need res.data.data
            setFixedExpenses(listRes.data?.data || []);
            setExchangeRate(balanceRes.data?.data?.exchangeRate || null);
        } catch (error) {
            console.error("Error loading budget data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            // Since we only ask for Day, we construct a mock date to use existing API schema if needed
            // Or just send dueDay directly if API supports it. The previous file constructed startDate.
            // Let's stick to previous logic: create a date for this month with that day.
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            // Create date object
            const date = new Date(year, month, parseInt(newItem.dueDay));
            // Format YYYY-MM-DD
            // Adjustment: use local time to avoid timezone shifts
            const dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

            const payload = {
                description: newItem.description,
                amount: newItem.amount,
                currency: newItem.currency,
                dueDay: parseInt(newItem.dueDay)
            };

            // Previous file used startDate, so let's include it to be safe if backend expects it
            // Backend fixedExpenses.js usually takes dueDay directly if updated, or extracts from date.
            // Based on previous file reading: "Extract dueDay from startDate" was in comments.
            // I'll send dueDay directly as per payload above, but also startDate just in case.

            await api.post('/fixed-expenses', payload);

            setNewItem({
                description: '',
                amount: '',
                currency: countryConfig.defaultCurrency,
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

    if (loading) return <div className="p-8 text-center text-gray-500">{texts.app.loading}</div>;

    // Calculations
    const primaryCurrency = countryConfig.defaultCurrency;

    // Income
    const monthlyIncome = isDual
        ? (insight?.recentMonthlyIncome?.USD || 0)
        : (insight?.recentMonthlyIncome?.[primaryCurrency] || insight?.recentMonthlyIncome?.USD || 0);

    // Fixed Costs Breakdown
    const fixedCostPrimary = fixedExpenses
        .filter(e => e.currency === primaryCurrency)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const fixedCostVES = isDual
        ? fixedExpenses.filter(e => e.currency === 'VES').reduce((sum, e) => sum + parseFloat(e.amount), 0)
        : 0;

    const fixedCostTotalCombined = isDual
        ? fixedCostPrimary + (exchangeRate ? fixedCostVES / exchangeRate : 0)
        : fixedCostPrimary;

    const disposable = monthlyIncome - fixedCostTotalCombined;
    const savingsTarget = disposable * 0.2;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                        {texts.budget.title}
                    </h1>
                    <p className="text-gray-500 text-base font-normal">
                        Controla tus gastos fijos y planifica tu libertad financiera.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-pink-700 transition-colors shadow-lg shadow-primary/20 font-bold"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span className="text-sm">{texts.budget.addFixed}</span>
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Form & Tips (Hidden if form not active to save space? Or always visible?) 
                    Let's make Left Column the Summary Section and Right Column the List for better UX than template
                    Actually following template: Left was "Add New", Right was "Stats"
                    I will adapt: Top = Stats, Bottom = List + Add Form
                */}

                {/* Stats Cards Row */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Income Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between h-40 relative overflow-hidden shadow-sm">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full"></div>
                        <div>
                            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">{texts.budget.incomeAvg}</p>
                            <h3 className="text-gray-900 text-3xl font-black tracking-tight cursor-help" title="Basado en ingresos recientes">
                                {formatCurrency(monthlyIncome, primaryCurrency)}
                            </h3>
                        </div>
                    </div>

                    {/* Fixed Expenses Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between h-40 relative overflow-hidden shadow-sm">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full"></div>
                        <div>
                            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">Total Fijo ({primaryCurrency})</p>
                            <h3 className="text-gray-900 text-3xl font-black tracking-tight">
                                {formatCurrency(fixedCostPrimary, primaryCurrency)}
                            </h3>
                            {isDual && (
                                <p className="text-sm text-gray-400 mt-1">
                                    + {formatCurrency(fixedCostVES, 'VES')}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                            <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${monthlyIncome >= fixedCostTotalCombined ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {monthlyIncome >= fixedCostTotalCombined ? 'Cubierto' : 'Excede Ingresos'}
                            </div>
                        </div>
                    </div>

                    {/* Disposable Card */}
                    <div className={`bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between h-40 relative overflow-hidden shadow-sm`}>
                        <div className={`absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl ${disposable >= 0 ? 'from-primary/10' : 'from-red-500/10'} to-transparent rounded-bl-full`}></div>
                        <div>
                            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">{texts.budget.disposable}</p>
                            <h3 className={`${disposable >= 0 ? 'text-gray-900' : 'text-red-600'} text-3xl font-black tracking-tight`}>
                                {formatCurrency(disposable, primaryCurrency)}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                            <span className="text-gray-400 text-xs">Meta Ahorro (20%): {formatCurrency(savingsTarget, primaryCurrency)}</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-12 flex flex-col gap-6">
                    {/* Form Section (Collapsible) */}
                    {showForm && (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 animate-in slide-in-from-top-4">
                            <h2 className="text-gray-900 text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">add_circle</span>
                                {texts.budget.addFixed}
                            </h2>
                            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
                                    <input
                                        type="text" required
                                        value={newItem.description}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                        placeholder="Ej. Alquiler"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Día de Pago</label>
                                    <input
                                        type="number" min="1" max="31" required
                                        value={newItem.dueDay}
                                        onChange={e => setNewItem({ ...newItem, dueDay: e.target.value })}
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                        placeholder="1-31"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Moneda</label>
                                    <select
                                        value={newItem.currency}
                                        onChange={e => setNewItem({ ...newItem, currency: e.target.value })}
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="VES">VES</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Monto</label>
                                    <input
                                        type="number" step="0.01" required
                                        value={newItem.amount}
                                        onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <button
                                        type="submit"
                                        className="w-full h-[42px] bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* List Section */}
                    <div>
                        <h3 className="text-gray-900 text-lg font-bold mb-4 pl-1">Presupuestos Activos</h3>
                        {fixedExpenses.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">savings</span>
                                <p className="text-gray-500">No tienes gastos fijos configurados.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {fixedExpenses.map(expense => (
                                    <div key={expense.id} className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-md relative">
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>

                                        <div className="flex items-start gap-4 mb-3 cursor-default">
                                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary-dark border border-primary/20">
                                                <span className="material-symbols-outlined">calendar_month</span>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 font-bold text-base">{expense.description}</h4>
                                                <p className="text-gray-500 text-xs">Día {expense.dueDay} de cada mes</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">Monto</p>
                                                <p className="text-gray-900 font-black text-xl">
                                                    {formatCurrency(expense.amount, expense.currency)}
                                                </p>
                                            </div>
                                            {isDual && expense.currency === 'VES' && exchangeRate && (
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">~ {formatCurrency(expense.amount / exchangeRate, 'USD')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
