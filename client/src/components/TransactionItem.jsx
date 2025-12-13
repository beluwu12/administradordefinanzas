import React from 'react';
import { ArrowUpRight, ArrowDownRight, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionItem({ transaction, onEdit, onDelete, onTagClick, simpleView = false }) {
    const isIncome = transaction.type === 'INCOME';
    const [touchStart, setTouchStart] = React.useState(null);
    const [touchEnd, setTouchEnd] = React.useState(null);
    const [swiped, setSwiped] = React.useState(false);

    // Minimum swipe distance
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setSwiped(true);
        }
        if (isRightSwipe) {
            setSwiped(false);
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-xl mb-3"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Delete Background for Swipe */}
            <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 rounded-xl">
                <Trash2 size={24} className="text-white" />
            </div>

            {/* Foreground Content */}
            <div
                className={`first-letter:relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-surface rounded-xl border border-transparent hover:border-border transition-transform duration-300 ease-out z-10 ${swiped ? '-translate-x-20' : 'translate-x-0'}`}
                onClick={() => swiped && onDelete && onDelete(transaction.id)} // Click to confirm delete if swiped
            >
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
                                            <button
                                                key={tag.id}
                                                onClick={(e) => {
                                                    if (onTagClick) {
                                                        e.stopPropagation();
                                                        onTagClick(tag);
                                                    }
                                                }}
                                                className={`bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] ${onTagClick ? 'hover:bg-primary/20 cursor-pointer' : ''}`}
                                            >
                                                {tag.name}
                                            </button>
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

                    {!simpleView && (onEdit || onDelete) && !swiped && (
                        <div className="hidden md:flex items-center gap-2">
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
        </div>
    );
}
