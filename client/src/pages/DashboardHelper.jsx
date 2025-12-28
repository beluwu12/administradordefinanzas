import React, { useEffect, useState } from 'react';
import api, { unwrapData, unwrapPaginated } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { texts, formatCurrency } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { isDualCurrency, getCountryConfig } from '../config/countries';
import TransactionItem from '../components/TransactionItem';
import SimplePieChart from '../components/common/SimplePieChart';

/**
 * DashboardHelper - Based on appuidesktop/dashboard_overview template
 * Cards layout with balance, goals, transactions
 */
const DashboardHelper = () => {
    const { user } = useAuth();
    const isDual = isDualCurrency(user?.country || 'VE');
    const countryConfig = getCountryConfig(user?.country || 'VE');

    const [balance, setBalance] = useState(isDual ? { USD: 0, VES: 0 } : { primary: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [rate, setRate] = useState(null);

    const fetchData = async () => {
        try {
            const requests = [
                api.get('/transactions/balance'),
                api.get('/transactions')
            ];

            if (isDual) {
                requests.push(api.get('/exchange-rate/usd-ves'));
            }

            const responses = await Promise.all(requests);
            const [balanceRes, transactionsRes] = responses;

            // Use unwrapData for balance response
            const balanceData = unwrapData(balanceRes);
            if (isDual) {
                if (balanceData && balanceData.primary) {
                    setBalance({
                        USD: balanceData.primary?.amount || 0,
                        VES: balanceData.secondary?.amount || 0
                    });
                } else {
                    setBalance(balanceData || { USD: 0, VES: 0 });
                }
            } else {
                if (balanceData && balanceData.primary) {
                    setBalance({ primary: balanceData.primary?.amount || 0 });
                } else if (typeof balanceData === 'number') {
                    setBalance({ primary: balanceData });
                } else {
                    const amount = balanceData?.primary?.amount || balanceData?.amount || balanceData?.[countryConfig.defaultCurrency] || 0;
                    setBalance({ primary: amount });
                }
            }

            // Use unwrapPaginated for transactions (supports pagination)
            const { data: txData } = unwrapPaginated(transactionsRes);
            setTransactions((txData || []).slice(0, 4));

            if (isDual && responses[2]) {
                const rateData = unwrapData(responses[2]);
                if (rateData && rateData.rate) {
                    setRate(rateData.rate);
                }
            }
        } catch (error) {
            console.error("Error loading dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalInVES = isDual && rate ? ((balance.VES || 0) + ((balance.USD || 0) * rate)) : 0;
    const primaryBalance = isDual ? (balance.USD || 0) : (balance.primary ?? 0);
    const isPositive = primaryBalance >= 0;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
    );

    return (
        <>
            {/* Top Row - Balance + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden shadow-sm lg:col-span-1">
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 font-medium mb-1 flex items-center gap-2">
                                    Patrimonio Neto Total
                                    <span className="material-symbols-outlined text-gray-400 text-sm cursor-pointer hover:text-foreground">
                                        visibility
                                    </span>
                                </p>
                                <h2 className="text-3xl font-bold text-foreground tracking-tight">
                                    {isDual
                                        ? formatCurrency(balance.USD || 0, 'USD')
                                        : formatCurrency(primaryBalance, countryConfig.defaultCurrency)
                                    }
                                </h2>
                                {isDual && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        + {formatCurrency(balance.VES || 0, 'VES')}
                                    </p>
                                )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${isPositive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                <span className="material-symbols-outlined text-sm">
                                    {isPositive ? 'trending_up' : 'trending_down'}
                                </span>
                                {isPositive ? '+2.4%' : '-1.2%'}
                            </span>
                        </div>
                        {/* Mini chart */}
                        <div className="flex items-end gap-1 h-10 w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                            {[40, 50, 45, 60, 55, 75, 70, 85, 80, 100].map((h, i) => (
                                <div
                                    key={i}
                                    className="w-full bg-primary rounded-t-sm transition-colors"
                                    style={{ height: `${h}%`, opacity: 0.2 + (i * 0.08) }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:col-span-2">
                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-full">
                        <h3 className="text-foreground font-bold text-xs">Acciones Rápidas</h3>
                        <button
                            onClick={() => navigate('/transactions', { state: { openForm: true } })}
                            className="flex items-center justify-center w-10 h-10 bg-primary hover:bg-pink-700 text-white rounded-full transition-all shadow-md shadow-primary/20 mt-1"
                            title="Agregar Transacción"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                        <span className="text-[10px] text-gray-500">Agregar Nuevo</span>
                    </div>

                    {/* Goals Mini Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-3">Metas del mes</h4>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Fondo de Emergencia</span>
                                    <span className="text-xs font-semibold text-primary">$400 / $500</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '80%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-200">
                            <Link
                                to="/goals"
                                className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-sm shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span> Nueva
                            </Link>
                        </div>
                    </div>

                    {/* Budget Mini Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-3">Control Presupuesto</h4>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Comestibles</span>
                                    <span className="text-xs font-semibold text-foreground">$350 / $500</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '70%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-200">
                            <Link
                                to="/budget"
                                className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-foreground text-xs font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">pie_chart</span> Ver
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Transactions Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {tx.type === 'income' ? 'payments' : 'shopping_bag'}
                                                </span>
                                            </div>
                                            <span className="text-foreground font-medium">
                                                {tx.description || 'Sin descripción'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {tx.tags?.[0]?.name || 'Sin categoría'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(tx.date).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-foreground'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '-'}
                                            {formatCurrency(Math.abs(tx.amount), tx.currency)}
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
                            <button
                                onClick={() => navigate('/transactions', { state: { openForm: true } })}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Agregar Transacción
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Exchange Rate Info (Venezuela only) */}
            {isDual && rate && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Estimado en Bolívares</span>
                        <p className="text-xs text-gray-400 mt-1">
                            Tasa BCV: <span className="text-primary font-mono">{rate.toLocaleString('es-VE')}</span>
                        </p>
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                        {formatCurrency(totalInVES, 'VES')}
                    </span>
                </div>
            )}
        </>
    );
};

export default DashboardHelper;
