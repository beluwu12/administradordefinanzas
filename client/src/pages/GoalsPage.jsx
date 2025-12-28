import React, { useEffect, useState } from 'react';
import api, { unwrapData } from '../api';
import { Link } from 'react-router-dom';
import { texts, formatCurrency } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';

/**
 * GoalsPage - Based on appuidesktop/savings_goals_tracker template
 * Stat cards + goal cards with images + contributions list
 */
export default function GoalsPage() {
    const { user } = useAuth();
    const countryConfig = getCountryConfig(user?.country || 'VE');
    const isDual = isDualCurrency(user?.country || 'VE');

    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        totalCost: '',
        months: '',
        currency: isDual ? 'USD' : countryConfig.defaultCurrency,
        description: '',
        startDate: new Date().toISOString().slice(0, 10)
    });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            // Use unwrapData to extract data from standardized response
            const goalsData = unwrapData(res);
            setGoals(goalsData || []);
        } catch (error) {
            console.error("Error fetching goals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const cost = parseFloat(newGoal.totalCost);
        const months = parseInt(newGoal.months);

        if (!cost || !months || months <= 0) {
            setFormError('Por favor ingresa un costo y cantidad de meses válidos.');
            return;
        }

        setFormError(null);
        setIsSubmitting(true);
        const monthlyAmount = cost / months;

        try {
            await api.post('/goals', {
                ...newGoal,
                monthlyAmount,
            });
            setShowForm(false);
            setNewGoal({
                title: '',
                totalCost: '',
                months: '',
                currency: isDual ? 'USD' : countryConfig.defaultCurrency,
                description: '',
                startDate: new Date().toISOString().slice(0, 10)
            });
            fetchGoals();
        } catch (err) {
            setFormError(err.message || texts.common.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta meta?')) return;
        try {
            await api.delete(`/goals/${id}`);
            fetchGoals();
        } catch (err) {
            alert(err.message);
        }
    };

    // Calculate totals
    const totalSaved = goals.reduce((sum, g) => sum + (parseFloat(g.savedAmount) || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + (parseFloat(g.totalCost) || 0), 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const nextGoal = goals.find(g => (g.savedAmount / g.totalCost) < 1);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
    );

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Mis Metas de Ahorro</h1>
                    <p className="mt-2 text-gray-500">Rastrea tu progreso y alcanza tus sueños financieros.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-black active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Nueva Meta
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total Saved */}
                <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-primary">
                        <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Total Ahorrado</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">
                            {formatCurrency(totalSaved, isDual ? 'USD' : countryConfig.defaultCurrency)}
                        </span>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">+12%</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">En {goals.length} metas activas</p>
                </div>

                {/* Overall Progress */}
                <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                        <span className="material-symbols-outlined">donut_large</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Progreso Total</p>
                    <div className="mt-2 flex items-center gap-4">
                        <span className="text-3xl font-extrabold text-foreground">{overallProgress.toFixed(0)}%</span>
                        <div className="h-2.5 flex-1 rounded-full bg-gray-100">
                            <div
                                className="h-2.5 rounded-full bg-primary shadow-sm transition-all duration-500"
                                style={{ width: `${Math.min(100, overallProgress)}%` }}
                            ></div>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        {formatCurrency(totalTarget - totalSaved, isDual ? 'USD' : countryConfig.defaultCurrency)} para completar
                    </p>
                </div>

                {/* Next Goal */}
                <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <span className="material-symbols-outlined">calendar_clock</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Próxima Meta</p>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-foreground truncate">
                            {nextGoal?.title || 'Sin metas activas'}
                        </span>
                        {nextGoal && (
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                                {((nextGoal.savedAmount / nextGoal.totalCost) * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                    {nextGoal && (
                        <p className="mt-1 text-xs text-gray-500">
                            Falta: {formatCurrency(nextGoal.totalCost - nextGoal.savedAmount, nextGoal.currency)}
                        </p>
                    )}
                </div>
            </div>

            {/* Goal Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 pt-6 pb-4">
                            <h3 className="text-lg font-bold text-foreground">Crear Nueva Meta</h3>
                            <p className="text-sm text-gray-500 mt-1">Define tu objetivo de ahorro</p>
                        </div>

                        {formError && (
                            <div className="mx-6 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="px-6 pb-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Título</label>
                                <input
                                    type="text" required
                                    value={newGoal.title}
                                    onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Ej. Viaje a Japón"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Costo Total</label>
                                    <input
                                        type="number" required
                                        value={newGoal.totalCost}
                                        onChange={e => setNewGoal({ ...newGoal, totalCost: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="5000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Meses</label>
                                    <input
                                        type="number" required
                                        value={newGoal.months}
                                        onChange={e => setNewGoal({ ...newGoal, months: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="12"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Moneda</label>
                                <select
                                    value={newGoal.currency}
                                    onChange={e => setNewGoal({ ...newGoal, currency: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                                >
                                    {countryConfig.currencies.map(cur => (
                                        <option key={cur} value={cur}>{cur}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-foreground font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-pink-700 transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creando...' : 'Crear Meta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Goals Grid */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {goals.length === 0 ? (
                    <div className="col-span-full">
                        <button
                            onClick={() => setShowForm(true)}
                            className="group relative flex min-h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-all hover:border-primary hover:bg-pink-50/30 hover:shadow-sm"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100 transition-colors group-hover:bg-primary group-hover:text-white group-hover:ring-primary">
                                <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-white transition-colors">add</span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Crear Nueva Meta</h3>
                            <p className="mt-2 text-center text-sm text-gray-500 max-w-[200px]">
                                Comienza a ahorrar para tu próxima aventura o compra.
                            </p>
                        </button>
                    </div>
                ) : (
                    <>
                        {goals.map(goal => {
                            const progressPercent = goal.totalCost > 0
                                ? Math.min(100, (goal.savedAmount / goal.totalCost) * 100)
                                : 0;
                            const remaining = goal.totalCost - goal.savedAmount;

                            return (
                                <div
                                    key={goal.id}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                                >
                                    {/* Card Header with gradient */}
                                    <div className="relative h-32 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-pink-100">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-white drop-shadow-sm">{goal.title}</h3>
                                                <p className="text-sm font-medium text-gray-200 drop-shadow-sm">{goal.description || 'Meta de ahorro'}</p>
                                            </div>
                                            {progressPercent >= 90 && (
                                                <div className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                                    ¡Casi Listo!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="flex flex-1 flex-col justify-between p-6">
                                        <div className="mb-6 space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-bold text-foreground">
                                                    {formatCurrency(goal.savedAmount, goal.currency)}
                                                </span>
                                                <span className="font-medium text-gray-500">
                                                    de {formatCurrency(goal.totalCost, goal.currency)}
                                                </span>
                                            </div>
                                            <div className="relative h-3 w-full rounded-full bg-gray-100">
                                                <div
                                                    className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-500 shadow-[0_2px_4px_rgba(219,15,121,0.3)]"
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs font-medium text-gray-500">
                                                <span className="text-primary">{progressPercent.toFixed(0)}% completado</span>
                                                <span>{formatCurrency(remaining, goal.currency)} restante</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Link
                                                to={`/goals/${goal.id}`}
                                                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300"
                                            >
                                                Detalles
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(goal.id)}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add New Goal Card */}
                        <button
                            onClick={() => setShowForm(true)}
                            className="group relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-all hover:border-primary hover:bg-pink-50/30 hover:shadow-sm"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100 transition-colors group-hover:bg-primary group-hover:text-white group-hover:ring-primary">
                                <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-white transition-colors">add</span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Crear Nueva Meta</h3>
                            <p className="mt-2 text-center text-sm text-gray-500 max-w-[200px]">
                                Comienza a ahorrar para tu próxima aventura.
                            </p>
                        </button>
                    </>
                )}
            </div>
        </>
    );
}
