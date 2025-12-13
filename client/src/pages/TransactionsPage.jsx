import React, { useEffect, useState } from 'react';
import api from '../api';
import TransactionForm from '../components/TransactionForm';
import TransactionItem from '../components/TransactionItem';
import { useLocation } from 'react-router-dom';
import { texts } from '../i18n/es';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.openForm) {
            setShowForm(true);
        }
        fetchTransactions();
    }, [location.state]);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/transactions');
            setTransactions(res.data || []);
        } catch (error) {
            console.error("Error fetching transactions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(texts.transactions.confirmDelete)) return;
        try {
            await api.delete(`/transactions/${id}`);
            fetchTransactions();
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

    if (loading) return <div className="p-8 text-center text-muted">{texts.app.loading}</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text">{texts.transactions.title}</h2>
                    <p className="text-muted">{texts.nav.transactions}</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-primary text-background px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                    {texts.transactions.addTitle}
                </button>
            </div>

            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-muted bg-surface rounded-xl border border-border">No hay transacciones registradas.</div>
                ) : (
                    transactions.map(tx => (
                        <TransactionItem
                            key={tx.id}
                            transaction={tx}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            {showForm && (
                <TransactionForm
                    initialData={editingTx}
                    onClose={handleFormClose}
                    onSuccess={() => {
                        handleFormClose();
                        fetchTransactions();
                    }}
                />
            )}
        </div>
    );
}
