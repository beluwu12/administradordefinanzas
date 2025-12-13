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

const DashboardHelper = () => {
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
            setBalance(balanceRes.data || { USD: 0, VES: 0 });
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
        { label: 'USD (en Bs)', value: rate ? balance.USD * rate : 0, color: '#2563eb' }, // blue-600
        { label: 'Bolívares', value: balance.VES, color: '#16a34a' } // green-600
    ].filter(d => d.value > 0);

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

                {/* Visual Chart */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg flex flex-col items-center justify-center min-h-[280px]">
                    <h3 className="text-lg font-bold text-text mb-6 w-full text-left">Distribución de Balance</h3>
                    {pieData.length > 0 ? (
                        <SimplePieChart data={pieData} size={160} />
                    ) : (
                        <div className="text-muted text-sm">No hay fondos para mostrar gráfico</div>
                    )}
                </div>

                {/* Balance Lists */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <SummaryCard
                            title="USD"
                            amount={balance.USD}
                            currency="USD"
                            icon="dollar"
                            className="h-32 bg-gradient-to-br from-blue-900/40 to-surface border-blue-500/20"
                        />
                        <SummaryCard
                            title="Bolívares"
                            amount={balance.VES}
                            currency="VES"
                            icon="wallet"
                            className="h-32 bg-gradient-to-br from-green-900/40 to-surface border-green-500/20"
                        />
                    </div>

                    {rate && (
                        <div className="bg-surface p-6 rounded-2xl border border-border flex justify-between items-center shadow-md transition-transform hover:scale-[1.02] duration-300">
                            <div>
                                <span className="text-muted text-xs uppercase font-bold tracking-wider">Total Estimado en Bolívares</span>
                                <p className="text-xs text-textSecondary mt-1">Tasa BCV: <span className="text-primary font-mono">{rate.toLocaleString('es-VE')}</span></p>
                            </div>
                            <span className="text-4xl font-black text-text tracking-tighter bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(totalInVES, 'VES')}</span>
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

            {/* Recent Transactions */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text">{texts.dashboard.recentTransactions}</h2>
                    <Link to="/transactions" className="text-primary hover:text-primary/80 font-medium text-sm">
                        {texts.dashboard.viewAll}
                    </Link>
                </div>

                <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-textSecondary">
                            No hay movimientos recientes
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {transactions.map(tx => (
                                <TransactionItem
                                    key={tx.id}
                                    transaction={tx}
                                    onClick={() => handleTransactionClick(tx)}
                                    onTagClick={setSelectedTag}
                                    simpleView={true}
                                />
                            ))}
                        </div>
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
