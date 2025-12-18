import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination Component
 * Displays page navigation with previous/next buttons and page info
 */
export default function Pagination({ pagination, onPageChange }) {
    const { page, totalPages, total, hasNext, hasPrev } = pagination;

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-lg mt-4">
            <div className="text-sm text-muted-foreground">
                Página <span className="font-medium text-foreground">{page}</span> de{' '}
                <span className="font-medium text-foreground">{totalPages}</span>
                <span className="hidden sm:inline ml-2">({total} resultados)</span>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrev}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasPrev
                            ? 'bg-primary text-primary-foreground hover:bg-blue-800'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                >
                    <ChevronLeft size={16} />
                    Anterior
                </button>

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNext}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasNext
                            ? 'bg-primary text-primary-foreground hover:bg-blue-800'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                >
                    Siguiente
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
