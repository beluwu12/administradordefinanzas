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
import { isDualCurrency, getCountryConfig } from '../config/countries';

const DashboardHelper = () => {
    const { user } = useAuth();
    const isDual = isDualCurrency(user?.country || 'VE');
    const countryConfig = getCountryConfig(user?.country || 'VE');

    // For dual currency: { USD: number, VES: number }
    // For single currency: { primary: number }
    const [balance, setBalance] = useState(isDual ? { USD: 0, VES: 0 } : { primary: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState(null);
    const navigate = useNavigate();

    const [rate, setRate] = useState(null);

    const fetchData = async () => {
        try {
            // Only fetch exchange rate for dual currency countries
            const requests = [
                api.get('/transactions/balance'),
                api.get('/transactions')
            ];

            if (isDual) {
                requests.push(api.get('/exchange-rate/usd-ves'));
            }

            const responses = await Promise.all(requests);
            const [balanceRes, transactionsRes] = responses;

            // Parse balance based on country type
            const balanceData = balanceRes.data;
            if (isDual) {
                // Dual currency (Venezuela): USD + VES
                if (balanceData && balanceData.primary) {
                    setBalance({
                        USD: balanceData.primary?.amount || 0,
                        VES: balanceData.secondary?.amount || 0
                    });
                } else {
                    setBalance(balanceData || { USD: 0, VES: 0 });
                }
            } else {
                // Single currency (Colombia, Chile, etc)
                if (balanceData && balanceData.primary) {
                    setBalance({ primary: balanceData.primary?.amount || 0 });
                } else if (typeof balanceData === 'number') {
                    setBalance({ primary: balanceData });
                } else {
                    // Try to get the first available balance
                    const amount = balanceData?.primary?.amount || balanceData?.amount || balanceData?.[countryConfig.defaultCurrency] || 0;
                    setBalance({ primary: amount });
                }
            }

            const txData = transactionsRes.data || [];
            setTransactions(txData.slice(0, 5));

            // Only set rate for dual currency
            if (isDual && responses[2]) {
                const rateData = responses[2].data;
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

    // Calculate total in VES only for dual currency
    const totalInVES = isDual && rate ? ((balance.VES || 0) + ((balance.USD || 0) * rate)) : 0;

    // Prepare Tag Chart Data
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
                {/* Visual Chart - Tags chart */}
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

                {/* Balance Cards - Country Aware */}
                <div className="space-y-4">
                    {isDual ? (
                        /* Venezuela: Dual Currency (USD + VES) */
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <SummaryCard
                                    label="Balance USD"
                                    amount={balance.USD || 0}
                                    currency="USD"
                                />
                                <SummaryCard
                                    label="Balance VES"
                                    amount={balance.VES || 0}
                                    currency="VES"
                                />
                            </div>

                            {/* Exchange Rate Card - Only for Venezuela */}
                            {rate && (
                                <div className="bg-surface p-4 md:p-6 rounded-2xl border border-border flex flex-col md:flex-row md:justify-between md:items-center gap-2 shadow-md transition-transform hover:scale-[1.02] duration-300 overflow-hidden">
                                    <div className="min-w-0">
                                        <span className="text-muted text-[10px] md:text-xs uppercase font-bold tracking-wider">Total Estimado en Bolívares</span>
                                        <p className="text-[10px] md:text-xs text-textSecondary mt-1">Tasa BCV: <span className="text-primary font-mono">{rate.toLocaleString('es-VE')}</span></p>
                                    </div>
                                    <span className="text-xl md:text-3xl lg:text-4xl font-black text-text tracking-tighter bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent truncate">{formatCurrency(totalInVES, 'VES')}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Other Countries: Single Currency */
                        (() => {
                            const primaryBalance = balance.primary ?? 0;
                            const isNegative = primaryBalance < 0;
                            return (
                                <div className={`bg-surface p-6 rounded-2xl border shadow-lg ${isNegative ? 'border-red-300' : 'border-border'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-muted text-xs uppercase font-bold tracking-wider">Balance Total</span>
                                        <span className="text-xs text-primary font-bold">{countryConfig.flag} {countryConfig.name}</span>
                                    </div>
                                    <p className={`text-4xl font-black tracking-tighter bg-clip-text text-transparent ${isNegative ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-primary'}`}>
                                        {formatCurrency(primaryBalance, countryConfig.defaultCurrency)}
                                    </p>
                                    <p className={`text-sm mt-2 ${isNegative ? 'text-red-500 font-bold' : 'text-muted'}`}>
                                        {countryConfig.defaultCurrency} {isNegative && '(Saldo Negativo)'}
                                    </p>
                                </div>
                            );
                        })()
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
