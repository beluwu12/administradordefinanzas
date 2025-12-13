import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TransactionItem from '../components/TransactionItem';
import SummaryCard from '../components/SummaryCard';
import Summary30Days from '../components/dashboard/Summary30Days';
import TransactionsModal from '../components/TransactionsModal';
import { texts, formatCurrency } from '../i18n/es';

import API_URL from '../config';

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
                axios.get(`${API_URL}/transactions/balance`),
                axios.get(`${API_URL}/transactions`),
                axios.get(`${API_URL}/exchange-rate/usd-ves`)
            ]);
            setBalance(balanceRes.data);
            setTransactions(transactionsRes.data.slice(0, 5));
            if (rateRes.data && rateRes.data.rate) {
                setRate(rateRes.data.rate);
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

    const handleTransactionClick = () => {
        navigate('/transactions');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Balance Cards */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text">{texts.dashboard.balance}</h2>
                    <button
                        onClick={() => navigate('/transactions', { state: { openForm: true } })}
                        className="md:hidden flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform"
                    >
                        <Plus size={16} /> {texts.dashboard.quickAdd}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SummaryCard
                        title="USD"
                        amount={balance.USD}
                        currency="USD"
                        icon="dollar"
                    />
                    <SummaryCard
                        title="Bolívares"
                        amount={balance.VES}
                        currency="VES"
                        icon="wallet"
                    />
                </div>
                {rate && (
                    <div className="mt-4 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                        <div>
                            <span className="text-textSecondary text-xs uppercase font-bold">Total en Bolívares</span>
                            <p className="text-xs text-muted">Tasa BCV: {rate.toLocaleString('es-VE')} Bs/$</p>
                        </div>
                        <span className="text-2xl font-bold text-text">{formatCurrency(totalInVES, 'VES')}</span>
                    </div>
                )}
            </section>

            {/* New 30-Day Summary Module */}
            <section>
                <Summary30Days />
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
