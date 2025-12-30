import React from 'react';

/**
 * Pagination Component
 * Updated styling with pink accent and Material Symbols
 */
export default function Pagination({ pagination, onPageChange }) {
    const { page, totalPages, total, hasNext, hasPrev } = pagination;

    if (totalPages <= 1) return null;

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const showAround = 1; // Pages to show around current

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > showAround + 2) pages.push('...');
            for (let i = Math.max(2, page - showAround); i <= Math.min(totalPages - 1, page + showAround); i++) {
                pages.push(i);
            }
            if (page < totalPages - showAround - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <nav aria-label="Paginación" className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={!hasPrev}
                className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="sr-only">Anterior</span>
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((p, idx) => (
                p === '...' ? (
                    <span
                        key={`ellipsis-${idx}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                        ...
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        aria-current={p === page ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-colors ${p === page
                                ? 'z-10 bg-pink-50 border-primary text-primary'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        {p}
                    </button>
                )
            ))}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={!hasNext}
                className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="sr-only">Siguiente</span>
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
        </nav>
    );
}
