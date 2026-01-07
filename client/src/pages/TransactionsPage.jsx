import React, { useEffect, useState } from 'react';
import api, { unwrapPaginated } from '../api';
import TransactionForm from '../components/TransactionForm';
import Pagination from '../components/common/Pagination';
import { useLocation } from 'react-router-dom';
import { texts, formatCurrency } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';

/**
 * TransactionsPage - Based on appuidesktop/movements_list template
 * Three stat cards + filters + table view
 */
export default function TransactionsPage() {
    const { user } = useAuth();
    const countryConfig = getCountryConfig(user?.country || 'VE');
    const isDual = isDualCurrency(user?.country || 'VE');

    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [periodFilter, setPeriodFilter] = useState('thisMonth');
    const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
    const [deletingTx, setDeletingTx] = useState(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.openForm) {
            setShowForm(true);
        }
    }, [location.state]);

    useEffect(() => {
        fetchTransactions(currentPage);
    }, [currentPage, periodFilter]);

    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        try {
            // Calculate date range based on period filter
            const now = new Date();
            let startDate, endDate;

            switch (periodFilter) {
                case 'lastMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case 'last3Months':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                    endDate = now;
                    break;
                case 'thisYear':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = now;
                    break;
                case 'thisMonth':
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = now;
                    break;
            }

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const res = await api.get(`/transactions?page=${page}&limit=10&startDate=${startStr}&endDate=${endStr}`);
            // Use unwrapPaginated to properly extract data and pagination
            const { data: txData, pagination: paginationData } = unwrapPaginated(res);
            setTransactions(txData || []);
            setPagination(paginationData);

            // Use stats from backend response (period totals)
            const responseStats = res.data?.stats;
            if (responseStats) {
                setStats({
                    income: responseStats.totalIncome || 0,
                    expense: responseStats.totalExpense || 0,
                    balance: responseStats.balance || 0
                });
            } else {
                // Fallback: Calculate from current page if backend doesn't provide stats
                let income = 0, expense = 0;
                (txData || []).forEach(tx => {
                    const amount = Math.abs(parseFloat(tx.amount));
                    if (tx.type === 'INCOME') income += amount;
                    else expense += amount;
                });
                setStats({ income, expense, balance: income - expense });
            }
        } catch (error) {
            console.error("Error fetching transactions", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleDelete = async (tx) => {
        setDeletingTx(tx);
    };

    const confirmDelete = async () => {
        if (!deletingTx) return;
        try {
            await api.delete(`/transactions/${deletingTx.id}`);
            setDeletingTx(null);
            fetchTransactions(currentPage);
        } catch (err) {
            alert(err.message || texts.common.error);
        }
    };

    const handleEdit = (tx) => {
        setEditingTx(tx);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setEditingTx(null);
        setShowForm(false);
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.tags?.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-foreground text-3xl font-extrabold tracking-tight mb-1">Movimientos</h2>
                    <p className="text-gray-500 text-sm">Rastrea y gestiona tus transacciones financieras.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-white border border-gray-200 text-foreground text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-foreground text-white text-sm font-bold shadow-lg shadow-gray-300 hover:bg-gray-800 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Agregar</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Income Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all hover:border-green-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <span className="material-symbols-outlined">trending_up</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Ingresos Totales</p>
                    <p className="text-foreground text-3xl font-extrabold tracking-tight">
                        {formatCurrency(stats.income, isDual ? 'USD' : countryConfig.defaultCurrency)}
                    </p>
                </div>

                {/* Expense Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all hover:border-red-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-red-50 rounded-lg text-red-500">
                            <span className="material-symbols-outlined">trending_down</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Gastos Totales</p>
                    <p className="text-foreground text-3xl font-extrabold tracking-tight">
                        {formatCurrency(stats.expense, isDual ? 'USD' : countryConfig.defaultCurrency)}
                    </p>
                </div>

                {/* Balance Card */}
                <div className="relative overflow-hidden rounded-2xl bg-foreground text-white p-6 shadow-xl shadow-gray-200 group hover:shadow-2xl transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-8xl">account_balance_wallet</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/10 rounded-lg text-white backdrop-blur-sm">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Saldo Neto</p>
                        <p className="text-white text-3xl font-extrabold tracking-tight">
                            {formatCurrency(stats.balance, isDual ? 'USD' : countryConfig.defaultCurrency)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400">search</span>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border-gray-200 rounded-xl leading-5 bg-gray-50 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white sm:text-sm transition-all"
                        placeholder="Buscar por descripción o categoría..."
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <select
                            value={periodFilter}
                            onChange={(e) => { setPeriodFilter(e.target.value); setCurrentPage(1); }}
                            className="appearance-none bg-gray-50 border border-gray-200 text-foreground py-3 pl-4 pr-10 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-white transition-colors shadow-sm"
                        >
                            <option value="thisMonth">Mes actual</option>
                            <option value="lastMonth">Mes anterior</option>
                            <option value="last3Months">Últimos 3 meses</option>
                            <option value="thisYear">Este año</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                        </div>
                    </div>
                    <button
                        className="flex items-center justify-center size-11 rounded-xl bg-gray-50 text-gray-500 hover:text-primary hover:bg-pink-50 transition-colors border border-gray-200 shadow-sm"
                        title="Más Filtros"
                    >
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                <div className="overflow-x-auto">
                    {filteredTransactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-gray-400">receipt_long</span>
                            </div>
                            <h4 className="text-foreground font-semibold mb-2">Sin transacciones</h4>
                            <p className="text-gray-500 text-sm mb-4">
                                {searchQuery ? 'No se encontraron resultados' : 'Registra tu primer gasto o ingreso'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Agregar Transacción
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 ${tx.type === 'income'
                                                    ? 'bg-green-50 text-green-600 border border-green-100'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-lg">
                                                        {tx.type === 'income' ? 'payments' : 'shopping_bag'}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-bold text-foreground">
                                                    {tx.description || 'Sin descripción'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {tx.tags?.[0] ? (() => {
                                                const tag = tx.tags[0];
                                                const colorMap = {
                                                    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: 'sell' },
                                                    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: 'trending_down' },
                                                    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', icon: 'attach_money' },
                                                    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', icon: 'bolt' },
                                                    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: 'subscriptions' },
                                                    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', icon: 'restaurant' },
                                                    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', icon: 'savings' },
                                                    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: 'shopping_cart' },
                                                };
                                                const colors = colorMap[tag.color] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: 'sell' };
                                                return (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                        <span className="material-symbols-outlined text-[14px] mr-1">{colors.icon}</span>
                                                        {tag.name}
                                                    </span>
                                                );
                                            })() : (
                                                <span className="text-gray-400 text-sm">Sin categoría</span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-5 whitespace-nowrap text-right text-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-green-600' : 'text-foreground'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '-'}
                                            {formatCurrency(Math.abs(tx.amount), tx.currency)}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(tx)}
                                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:text-primary hover:border-primary transition-all shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tx)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination && filteredTransactions.length > 0 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Mostrando <span className="font-bold text-foreground">{((currentPage - 1) * 10) + 1}</span> a{' '}
                                    <span className="font-bold text-foreground">{Math.min(currentPage * 10, pagination.total)}</span> de{' '}
                                    <span className="font-bold text-foreground">{pagination.total}</span> resultados
                                </p>
                            </div>
                            <Pagination
                                pagination={pagination}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Form Modal */}
            {showForm && (
                <TransactionForm
                    initialData={editingTx}
                    onClose={handleFormClose}
                    onSuccess={() => {
                        handleFormClose();
                        fetchTransactions(currentPage);
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingTx && (
                <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDeletingTx(null)}></div>
                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:w-full sm:max-w-lg border border-gray-100">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50 sm:mx-0 sm:h-10 sm:w-10 ring-8 ring-red-50/50">
                                            <span className="material-symbols-outlined text-red-600">warning</span>
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <h3 className="text-lg font-bold leading-6 text-foreground">Eliminar Transacción</h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    ¿Estás seguro de que deseas eliminar esta transacción de <span className="font-bold text-foreground">{deletingTx.description || 'Sin descripción'}</span> por <span className="font-bold text-foreground">{formatCurrency(Math.abs(deletingTx.amount), deletingTx.currency)}</span>? Esta acción no se puede deshacer.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3 border-t border-gray-100">
                                    <button
                                        onClick={confirmDelete}
                                        className="inline-flex w-full justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => setDeletingTx(null)}
                                        className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
