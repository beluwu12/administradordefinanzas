import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Wallet, Target, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import TransactionItem from '../components/TransactionItem';
import SummaryCard from '../components/SummaryCard';
import Summary30Days from '../components/dashboard/Summary30Days';
import SimplePieChart from '../components/common/SimplePieChart';
import TransactionsModal from '../components/TransactionsModal';
import { texts, formatCurrency } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { isDualCurrency } from '../config/countries';

const DashboardHelper = () => {
    const { user } = useAuth();
    const isDual = isDualCurrency(user?.country || 'VE');

    const [balance, setBalance] = useState({ USD: 0, VES: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState(null);
    const navigate = useNavigate();

    const [rate, setRate] = useState(null);

    const fetchData = async () => {
        try {
            const [balanceRes, transactionsRes, rateRes] = await Promise.all([
                api.get('/transactions/balance'),
                api.get('/transactions'),
                api.get('/exchange-rate/usd-ves')
            ]);

            // Parse polymorphic balance response
            const balanceData = balanceRes.data;
            if (balanceData && balanceData.primary) {
                // New polymorphic format: { primary: { amount }, secondary: { amount } }
                setBalance({
                    USD: balanceData.primary?.amount || 0,
                    VES: balanceData.secondary?.amount || 0
                });
            } else {
                // Fallback for legacy format
                setBalance(balanceData || { USD: 0, VES: 0 });
            }

            const txData = transactionsRes.data || [];
            setTransactions(txData.slice(0, 5));
            const rateData = rateRes.data;
            if (rateData && rateData.rate) {
                setRate(rateData.rate);
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

    const totalInVES = rate ? (balance.VES + (balance.USD * rate)) : balance.VES;

    // Prepare Pie Chart Data
    const pieData = [
        { label: 'USD', value: rate ? balance.USD * rate : 0, color: '#2563eb' }, // blue-600
        { label: 'Bolívares', value: balance.VES, color: '#16a34a' } // green-600
    ].filter(d => d.value > 0);

    const pieDataDual = pieData; // Alias for code compatibility

    // Prepare Tag Chart Data
    // Count transactions by tag (only those with tags)
    const tagCounts = {};
    transactions.forEach(tx => {
        if (tx.tags && tx.tags.length > 0) {
            tx.tags.forEach(tag => {
                tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
            });
        }
    });

    const tagColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const tagChartData = Object.entries(tagCounts)
        .map(([name, count], index) => ({
            label: name,
            value: count,
            color: tagColors[index % tagColors.length]
        }))
        .sort((a, b) => b.value - a.value);

    const handleTransactionClick = () => {
        navigate('/transactions');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn pb-24 md:pb-0">
            {/* Balance Cards & Chart Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Visual Chart - Tags chart only for dual currency (VE) users */}
                {isDual ? (
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg flex flex-col min-h-[280px]">
                        <h3 className="text-lg font-bold text-text mb-6">Gastos por Etiqueta</h3>
                        {tagChartData.length > 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <SimplePieChart data={tagChartData} size={160} />
                            </div>
                        ) : (
                            <div className="text-muted text-sm flex-1 flex items-center justify-center">Sin transacciones con etiquetas</div>
                        )}
                    </div>
                ) : (
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg flex flex-col min-h-[280px]">
                        <h3 className="text-lg font-bold text-text mb-6">Gastos por Etiqueta</h3>
                        {tagChartData.length > 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <SimplePieChart data={tagChartData} size={160} />
                            </div>
                        ) : (
                            <div className="text-muted text-sm">Sin transacciones con etiquetas</div>
                        )}
                    </div>
                )}

                {/* Balance Cards */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <SummaryCard
                            label="Balance Total"
                            amount={balance.USD}
                            currency="USD"
                        />
                        <SummaryCard
                            label="Balance Total"
                            amount={balance.VES}
                            currency="VES"
                        />
                    </div>

                    {rate && (
                        <div className="bg-surface p-4 md:p-6 rounded-2xl border border-border flex flex-col md:flex-row md:justify-between md:items-center gap-2 shadow-md transition-transform hover:scale-[1.02] duration-300 overflow-hidden">
                            <div className="min-w-0">
                                <span className="text-muted text-[10px] md:text-xs uppercase font-bold tracking-wider">Total Estimado en Bolívares</span>
                                <p className="text-[10px] md:text-xs text-textSecondary mt-1">Tasa BCV: <span className="text-primary font-mono">{rate.toLocaleString('es-VE')}</span></p>
                            </div>
                            <span className="text-xl md:text-3xl lg:text-4xl font-black text-text tracking-tighter bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent truncate">{formatCurrency(totalInVES, 'VES')}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Actions (Mobile Only - usually covered by FAB but good to have) */}
            <div className="md:hidden flex gap-4 overflow-x-auto pb-2">
                {/* Can add horizontal scrolling actions here if needed */}
            </div>

            {/* Recent Transactions */}
            <section>
                <div className="flex justify-between items-end mb-4 px-1">
                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        {texts.dashboard.recentTransactions}
                    </h2>
                    <Link to="/transactions" className="text-xs text-primary font-bold hover:underline">
                        {texts.common.seeAll}
                    </Link>
                </div>

                <div className="space-y-3">
                    {transactions.length > 0 ? (
                        transactions.map(transaction => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                simpleView={true}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon={Wallet}
                            title="Sin movimientos"
                            description="Tus transacciones recientes aparecerán aquí."
                            action={() => navigate('/transactions', { state: { openForm: true } })}
                            actionLabel="Registrar Gasto"
                        />
                    )}
                </div>
            </section>

            {/* Transaction Modal by Tag */}
            {selectedTag && (
                <TransactionsModal
                    tag={selectedTag}
                    onClose={() => setSelectedTag(null)}
                />
            )}
        </div>
    );
};

export default DashboardHelper;
