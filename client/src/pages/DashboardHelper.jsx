/**
 * DashboardHelper - Refactored with Design System
 */
import React, { useEffect, useState } from 'react';
import api, { unwrapData, unwrapPaginated } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { isDualCurrency, getCountryConfig } from '../config/countries';
import TransactionForm from '../components/TransactionForm';
import { Card, Button, Badge } from '@/design-system';

const DashboardHelper = () => {
    const { user } = useAuth();
    const isDual = isDualCurrency(user?.country || 'VE');
    const countryConfig = getCountryConfig(user?.country || 'VE');

    const [balance, setBalance] = useState(isDual ? { USD: 0, VES: 0 } : { primary: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [rate, setRate] = useState(null);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [goals, setGoals] = useState([]);
    const [changePercent, setChangePercent] = useState(null);
    const [fixedExpenses, setFixedExpenses] = useState([]);

    const fetchData = async () => {
        try {
            const requests = [
                api.get('/transactions/balance'),
                api.get('/transactions'),
                api.get('/goals'),
                api.get('/insight/summary'),
                api.get('/fixed-expenses')
            ];

            if (isDual) requests.push(api.get('/exchange-rate/usd-ves'));

            const responses = await Promise.all(requests);
            const [balanceRes, transactionsRes, goalsRes, insightRes, fixedExpensesRes] = responses;

            const balanceData = unwrapData(balanceRes);
            if (isDual) {
                setBalance({
                    USD: balanceData?.primary?.amount || 0,
                    VES: balanceData?.secondary?.amount || 0
                });
            } else {
                setBalance({ primary: balanceData?.primary?.amount || balanceData?.amount || 0 });
            }

            const { data: txData } = unwrapPaginated(transactionsRes);
            setTransactions((txData || []).slice(0, 4));
            setGoals(unwrapData(goalsRes) || []);
            setChangePercent(unwrapData(insightRes)?.changePercent ?? null);
            setFixedExpenses(unwrapData(fixedExpensesRes) || []);

            if (isDual && responses[5]) {
                const rateData = unwrapData(responses[5]);
                if (rateData?.rate) setRate(rateData.rate);
            }
        } catch (error) {
            console.error("Error loading dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const totalInVES = isDual && rate ? ((balance.VES || 0) + ((balance.USD || 0) * rate)) : 0;
    const primaryBalance = isDual ? (balance.USD || 0) : (balance.primary ?? 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Row - Balance + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <Card interactive className="p-5 relative overflow-hidden lg:col-span-1">
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 font-medium mb-1 flex items-center gap-2">
                                    Patrimonio Neto Total
                                    <span className="material-symbols-outlined text-gray-400 text-sm">visibility</span>
                                </p>
                                <h2 className="text-3xl font-bold text-foreground tracking-tight">
                                    {isDual ? formatCurrency(balance.USD || 0, 'USD') : formatCurrency(primaryBalance, countryConfig.defaultCurrency)}
                                </h2>
                                {isDual && <p className="text-sm text-gray-500 mt-1">+ {formatCurrency(balance.VES || 0, 'VES')}</p>}
                            </div>
                            {changePercent !== null && (
                                <Badge variant={changePercent >= 0 ? 'success' : 'danger'} icon={changePercent >= 0 ? 'trending_up' : 'trending_down'}>
                                    {changePercent >= 0 ? '+' : ''}{changePercent}%
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-end gap-1 h-10 w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                            {[40, 50, 45, 60, 55, 75, 70, 85, 80, 100].map((h, i) => (
                                <div key={i} className="w-full bg-primary rounded-t-sm" style={{ height: `${h}%`, opacity: 0.2 + (i * 0.08) }} />
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Right Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:col-span-2">
                    {/* Quick Actions */}
                    <Card className="p-4 flex flex-col items-center justify-center gap-2 text-center h-full">
                        <h3 className="text-foreground font-bold text-xs">Acciones Rápidas</h3>
                        <Button size="icon" onClick={() => setShowTransactionForm(true)} icon="add" />
                        <span className="text-[10px] text-gray-500">Nueva transacción</span>
                    </Card>

                    {/* Goals Mini Card */}
                    <Card interactive className="p-5 flex flex-col justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-3">Metas de Ahorro</h4>
                            {goals.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 truncate max-w-[120px]">{goals[0].title}</span>
                                        <span className="text-xs font-semibold text-primary">
                                            {formatCurrency(goals[0].savedAmount || 0, goals[0].currency)} / {formatCurrency(goals[0].totalCost, goals[0].currency)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, (goals[0].savedAmount / goals[0].totalCost) * 100)}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">Sin metas creadas</p>
                            )}
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <Link to="/goals">
                                <Button size="sm" className="w-full" icon="visibility">Ver todas</Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Budget Mini Card */}
                    <Card interactive className="p-5 flex flex-col justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-3">Gastos Fijos</h4>
                            {fixedExpenses.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 truncate max-w-[100px]">{fixedExpenses[0].description}</span>
                                        <span className="text-xs font-semibold text-foreground">{formatCurrency(fixedExpenses[0].amount, fixedExpenses[0].currency)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Día {fixedExpenses[0].dueDay} • {fixedExpenses.length} total</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">Sin gastos fijos</p>
                            )}
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <Link to="/budget">
                                <Button variant="secondary" size="sm" className="w-full" icon="pie_chart">Ver</Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Transactions Table */}
            <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-foreground font-bold text-lg">Transacciones Recientes</h3>
                    <Link to="/transactions" className="text-gray-500 hover:text-foreground transition-colors">
                        <span className="material-symbols-outlined">more_horiz</span>
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    {transactions.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Transacción</th>
                                    <th className="px-6 py-3">Categoría</th>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                <span className="material-symbols-outlined text-sm">{tx.type === 'INCOME' ? 'payments' : 'shopping_bag'}</span>
                                            </div>
                                            <span className="text-foreground font-medium">{tx.description || 'Sin descripción'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{tx.tags?.[0]?.name || 'Sin categoría'}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className={`px-6 py-4 text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-foreground'}`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), tx.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-gray-400">receipt_long</span>
                            </div>
                            <h4 className="text-foreground font-semibold mb-2">Sin transacciones</h4>
                            <p className="text-gray-500 text-sm mb-4">Registra tu primer gasto o ingreso</p>
                            <Button onClick={() => navigate('/transactions', { state: { openForm: true } })} icon="add">
                                Agregar Transacción
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Exchange Rate Info */}
            {isDual && rate && (
                <Card className="p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Estimado en Bolívares</span>
                        <p className="text-xs text-gray-400 mt-1">Tasa BCV: <span className="text-primary font-mono">{rate.toLocaleString('es-VE')}</span></p>
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">{formatCurrency(totalInVES, 'VES')}</span>
                </Card>
            )}

            {showTransactionForm && (
                <TransactionForm
                    onClose={() => setShowTransactionForm(false)}
                    onSuccess={() => { setShowTransactionForm(false); fetchData(); }}
                />
            )}
        </div>
    );
};

export default DashboardHelper;
