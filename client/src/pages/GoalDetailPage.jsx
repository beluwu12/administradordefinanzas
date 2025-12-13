import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { texts, formatCurrency } from '../i18n/es';

import API_URL from '../config';

export default function GoalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchGoalDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchGoalDetails = async () => {
        try {
            // Re-use list endpoint and filter (not ideal for prod but fine for now, or create GET /goals/:id)
            // Actually, best to create GET /goals/:id in backend or just filter client side if list is small.
            // Let's rely on list for now to avoid editing backend again immediately. 
            // Wait, I didn't create GET /goals/:id in backend.
            const res = await axios.get(`${API_URL}/goals`);
            const found = res.data.find(g => g.id === id);
            setGoal(found);
        } catch (error) {
            console.error("Error fetching goal", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMonth = async (monthId, period, currentStatus) => {
        try {
            setGoal(prev => ({
                ...prev,
                progress: prev.progress.map(m => {
                    if (m.id !== monthId) return m;
                    return period === 'q1' ? { ...m, isQ1Paid: !currentStatus } : { ...m, isQ2Paid: !currentStatus };
                })
            })); // Optimistic update

            await axios.patch(`${API_URL}/goals/${id}/toggle-month`, {
                monthId,
                period,
                isPaid: !currentStatus
            });
            fetchGoalDetails(); // Refresh for correct totals
        } catch (error) {
            console.error("Error toggling", error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Eliminar este objetivo?')) return;
        try {
            await axios.delete(`${API_URL}/goals/${id}`);
            navigate('/goals');
        } catch {
            alert('Error eliminando objetivo');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">{texts.app.loading}</div>;
    if (!goal) return <div className="p-8 text-center text-muted">Objetivo no encontrado</div>;

    // Prevent division by zero
    const progressPercent = goal.totalCost > 0
        ? Math.min(100, (goal.savedAmount / goal.totalCost) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <button
                onClick={() => navigate('/goals')}
                className="flex items-center gap-2 text-muted hover:text-text transition-colors"
            >
                <ArrowLeft size={20} /> Volver a Objetivos
            </button>

            {/* Hero Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-primary">
                    <TrendingUp size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-text mb-2">{goal.title}</h2>
                            <p className="text-muted text-sm">{goal.description || "Sin descripción"}</p>
                        </div>
                        <button onClick={handleDelete} className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors">
                            <Trash2 size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                        <div>
                            <div className="text-xs text-muted uppercase font-bold mb-1">Total Meta</div>
                            <div className="text-2xl font-bold text-text">{formatCurrency(goal.totalCost, goal.currency)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted uppercase font-bold mb-1">Ahorrado</div>
                            <div className="text-2xl font-bold text-primary">{formatCurrency(goal.savedAmount, goal.currency)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted uppercase font-bold mb-1">Falta</div>
                            <div className="text-2xl font-bold text-text opacity-60">{formatCurrency(Math.max(0, goal.totalCost - goal.savedAmount), goal.currency)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted uppercase font-bold mb-1">Progreso</div>
                            <div className="text-2xl font-bold text-secondary">{progressPercent.toFixed(1)}%</div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="h-4 bg-background rounded-full overflow-hidden border border-[#ffffff05]">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Progress List */}
            <div>
                <h3 className="text-xl font-bold text-text mb-4">Plan de Ahorro Mensual</h3>
                <div className="bg-surface border border-border rounded-xl overflows-hidden">
                    <div className="divide-y divide-border">
                        {goal.progress.map((month) => (
                            <div
                                key={month.id}
                                className={`p-4 flex flex-col sm:flex-row items-center justify-between transition-colors hover:bg-background/50`}
                            >
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background border-2 border-border text-muted font-bold">
                                        {month.monthIndex}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text">Mes {month.monthIndex}</p>
                                        <p className="text-xs text-muted">Meta: {formatCurrency(month.target, goal.currency)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => toggleMonth(month.id, 'q1', month.isQ1Paid)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${month.isQ1Paid ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border text-muted hover:border-text'}`}
                                    >
                                        {month.isQ1Paid ? <CheckCircle size={18} /> : <Circle size={18} />}
                                        <span className="text-sm font-medium">1ra Quicena</span>
                                    </button>

                                    <button
                                        onClick={() => toggleMonth(month.id, 'q2', month.isQ2Paid)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${month.isQ2Paid ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border text-muted hover:border-text'}`}
                                    >
                                        {month.isQ2Paid ? <CheckCircle size={18} /> : <Circle size={18} />}
                                        <span className="text-sm font-medium">2da Quicena</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
