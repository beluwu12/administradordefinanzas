import React from 'react';
import { ArrowUpRight, ArrowDownRight, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionItem({ transaction, onEdit, onDelete, simpleView = false }) {
    const isIncome = transaction.type === 'INCOME';

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-surface/50 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isIncome ? 'bg-secondary/10 text-secondary' : 'bg-danger/10 text-danger'}`}>
                    {simpleView ? (
                        isIncome ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />
                    ) : (
                        isIncome ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />
                    )}
                </div>
                <div>
                    <p className="font-semibold text-text">{transaction.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1">
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.source && (
                            <>
                                <span>•</span>
                                <span>{transaction.source}</span>
                            </>
                        )}
                        {transaction.tags && transaction.tags.length > 0 && (
                            <>
                                <span>•</span>
                                <div className="flex gap-1">
                                    {transaction.tags.map(tag => (
                                        <span key={tag.id} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <div className="text-right">
                    <p className={`font-bold ${isIncome ? 'text-secondary' : 'text-text'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    {transaction.currency === 'VES' && transaction.exchangeRate && (
                        <p className="text-xs text-muted">Rate: {transaction.exchangeRate}</p>
                    )}
                </div>

                {!simpleView && (onEdit || onDelete) && (
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(transaction)}
                                className="p-2 text-muted hover:text-primary transition-colors bg-background border border-border rounded-md hover:border-primary"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(transaction.id)}
                                className="p-2 text-muted hover:text-danger transition-colors bg-background border border-border rounded-md hover:border-danger"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
