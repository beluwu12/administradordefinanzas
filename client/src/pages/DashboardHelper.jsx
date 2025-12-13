import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TransactionItem from '../components/TransactionItem';
import SummaryCard from '../components/SummaryCard';
import Summary30Days from '../components/dashboard/Summary30Days';
import { texts } from '../i18n/es';

const API_URL = 'http://localhost:3000/api';

const DashboardHelper = () => {
    const [balance, setBalance] = useState({ USD: 0, VES: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [balanceRes, transactionsRes] = await Promise.all([
                axios.get(`${API_URL}/transactions/balance`),
                axios.get(`${API_URL}/transactions`)
            ]);
            setBalance(balanceRes.data);
            setTransactions(transactionsRes.data.slice(0, 5)); // Only show recent 5
        } catch (error) {
            console.error("Error loading dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                                    simpleView={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default DashboardHelper;
