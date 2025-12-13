import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Tag } from 'lucide-react';
import TransactionItem from './TransactionItem';
import { texts } from '../i18n/es';

const API_URL = 'http://localhost:3000/api';

export default function TransactionsModal({ tag, onClose }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tag?.id) {
            fetchTransactions();
        }
    }, [tag]);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${API_URL}/tags/${tag.id}/transactions`);
            setTransactions(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!tag) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-background/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${tag.color}-500/20 text-${tag.color}-500`}>
                            <Tag size={16} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-text">{tag.name}</h3>
                            <p className="text-xs text-muted">Historial de movimientos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-text transition-colors p-2 hover:bg-background rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 flex-1 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-muted">{texts.app.loading}</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            No hay transacciones asociadas a esta etiqueta.
                        </div>
                    ) : (
                        transactions.map(t => (
                            <TransactionItem
                                key={t.id}
                                transaction={t}
                                simpleView={true}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-background/30 text-center text-xs text-muted">
                    {transactions.length} movimientos encontrados
                </div>
            </div>
        </div>
    );
}
