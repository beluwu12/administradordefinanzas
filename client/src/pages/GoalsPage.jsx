import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Target, Plus, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { texts, formatCurrency } from '../i18n/es';
import API_URL from '../config';

export default function GoalsPage() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        totalCost: '',
        monthlyAmount: '',
        currency: 'USD',
        description: '',
        startDate: new Date().toISOString().slice(0, 10)
    });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await axios.get(`${API_URL}/goals`);
            setGoals(res.data);
        } catch (error) {
            console.error("Error fetching goals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/goals`, newGoal);
            setShowForm(false);
            setNewGoal({
                title: '',
                totalCost: '',
                monthlyAmount: '',
                currency: 'USD',
                description: '',
                startDate: new Date().toISOString().slice(0, 10)
            });
            fetchGoals();
        } catch (error) {
            alert(texts.common.error);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">{texts.app.loading}</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text">{texts.nav.goals || "Objetivos"}</h2>
                    <p className="text-muted">Metas de ahorro y compras futuras.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary text-background px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <Plus size={18} /> Nuevo Objetivo
                </button>
            </div>

            {showForm && (
                <div className="bg-surface border border-border rounded-xl p-6 shadow-lg mb-6">
                    <h3 className="text-lg font-bold text-text mb-4">Crear Nuevo Objetivo</h3>
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
                                <label className="block text-xs font-medium text-muted mb-1">Ahorro Mensual</label>
                                <input
                                    type="number" required
                                    value={newGoal.monthlyAmount}
                                    onChange={e => setNewGoal({ ...newGoal, monthlyAmount: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text"
                                    placeholder="200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1">Moneda</label>
                                <select
                                    value={newGoal.currency}
                                    onChange={e => setNewGoal({ ...newGoal, currency: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="VES">VES (Bs.)</option>
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
                    <div className="col-span-full text-center py-10 text-muted">
                        No tienes objetivos activos. ¡Crea uno para empezar a ahorrar!
                    </div>
                ) : (
                    goals.map(goal => {
                        const progressPercent = Math.min(100, (goal.savedAmount / goal.totalCost) * 100);
                        return (
                            <Link to={`/goals/${goal.id}`} key={goal.id} className="group">
                                <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-primary/10 p-3 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Target size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-muted bg-background px-2 py-1 rounded-full border border-border">
                                            {formatCurrency(goal.monthlyAmount, goal.currency)} /mes
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-text mb-1">{goal.title}</h3>
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="text-xs text-muted">
                                            Ahorrado: <span className="text-text font-bold">{formatCurrency(goal.savedAmount, goal.currency)}</span>
                                        </div>
                                        <div className="text-xs text-muted">
                                            Meta: <span className="text-text font-bold">{formatCurrency(goal.totalCost, goal.currency)}</span>
                                        </div>
                                    </div>

                                    <div className="h-2 bg-background rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-muted">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> {goal.durationMonths} meses
                                        </span>
                                        <span className={`font-bold ${progressPercent >= 100 ? 'text-green-500' : 'text-primary'}`}>
                                            {progressPercent.toFixed(0)}%
                                        </span>
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
