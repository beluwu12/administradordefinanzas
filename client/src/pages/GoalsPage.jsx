import React, { useEffect, useState } from 'react';
import api from '../api';
import { Target, Plus, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import CircularProgressBar from '../components/common/CircularProgressBar';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { texts, formatCurrency } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';

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
        currency: countryConfig.defaultCurrency,
        description: '',
        startDate: new Date().toISOString().slice(0, 10)
    });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data || []);
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
                currency: countryConfig.defaultCurrency,
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

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-surface rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text">{texts.nav.goals || "Objetivos"}</h2>
                    <p className="text-muted">Metas de ahorro y compras futuras.</p>
                </div>
            </div>

            {showForm && (
                <div className="bg-surface border border-border rounded-xl p-6 shadow-lg mb-6">
                    <h3 className="text-lg font-bold text-text mb-4">Crear Nuevo Objetivo</h3>

                    {/* Error Display */}
                    {formError && (
                        <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm mb-4" role="alert">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1">Título</label>
                                <input
                                    type="text" required
                                    value={newGoal.title}
                                    onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text"
                                    placeholder="Ej. Laptop Nueva"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1">Costo Total</label>
                                <input
                                    type="number" required
                                    value={newGoal.totalCost}
                                    onChange={e => setNewGoal({ ...newGoal, totalCost: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text"
                                    placeholder="1000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1">Meses para alcanzar meta</label>
                                <input
                                    type="number" required
                                    value={newGoal.months}
                                    onChange={e => setNewGoal({ ...newGoal, months: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text"
                                    placeholder="Ej. 12"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1">Moneda</label>
                                <select
                                    value={newGoal.currency}
                                    onChange={e => setNewGoal({ ...newGoal, currency: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text"
                                >
                                    {countryConfig.currencies.map(cur => (
                                        <option key={cur} value={cur}>{cur}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors">
                            Crear Objetivo
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={Trophy}
                            title="Sin objetivos"
                            description="Establece una meta de ahorro para ese viaje o compra especial."
                            action={() => setShowForm(true)}
                            actionLabel="Crear mi primer objetivo"
                        />
                    </div>
                ) : (
                    goals.map(goal => {
                        const progressPercent = goal.totalCost > 0
                            ? Math.min(100, (goal.savedAmount / goal.totalCost) * 100)
                            : 0;
                        const isCompleted = progressPercent >= 100;

                        return (
                            <Link to={`/goals/${goal.id}`} key={goal.id} className="group">
                                <div className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all shadow-sm hover:shadow-md relative overflow-hidden flex flex-col items-center text-center h-full">

                                    <div className="absolute top-4 right-4">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Target size={20} />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <CircularProgressBar
                                            percentage={progressPercent}
                                            size={120}
                                            color={isCompleted ? '#22c55e' : '#3b82f6'}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className={`text-xl font-bold ${isCompleted ? 'text-green-500' : 'text-primary'}`}>
                                                    {progressPercent.toFixed(0)}%
                                                </span>
                                            </div>
                                        </CircularProgressBar>
                                    </div>

                                    <h3 className="text-lg font-bold text-text mb-1 truncate w-full">{goal.title}</h3>

                                    <div className="text-xs text-muted mb-4 bg-background px-3 py-1 rounded-full border border-border">
                                        Meta: <span className="text-text font-bold">{formatCurrency(goal.totalCost, goal.currency)}</span>
                                    </div>

                                    <div className="w-full grid grid-cols-2 gap-2 text-xs border-t border-border pt-4 mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-muted mb-1">Ahorrado</span>
                                            <span className="font-bold text-text">{formatCurrency(goal.savedAmount, goal.currency)}</span>
                                        </div>
                                        <div className="flex flex-col border-l border-border pl-2">
                                            <span className="text-muted mb-1">Cuota</span>
                                            <span className="font-bold text-text">{formatCurrency(goal.monthlyAmount, goal.currency)}/m</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
