/**
 * DateTimeInput Component
 * Extracted from TransactionForm for SRP compliance
 * Handles date and time selection with 12-hour format
 */

import React from 'react';

export default function DateTimeInput({
    datePart,
    hours12,
    minutes,
    seconds,
    ampm,
    onDateChange,
    onTimeChange
}) {
    return (
        <div className="bg-background border border-border rounded-lg p-3">
            <div className="flex flex-col gap-2">
                {/* Date Input */}
                <div className="flex-1">
                    <input
                        type="date"
                        value={datePart}
                        onChange={e => onDateChange(e.target.value)}
                        className="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-sm text-text"
                        aria-label="Fecha de la transacción"
                    />
                </div>

                {/* Time Input */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-surface border border-border rounded-md">
                        <input
                            type="number"
                            min="1"
                            max="12"
                            value={hours12}
                            onChange={e => onTimeChange('hour', e.target.value)}
                            className="w-10 sm:w-12 bg-transparent text-center py-1.5 text-sm text-text focus:outline-none"
                            placeholder="HH"
                            aria-label="Hora"
                        />
                        <span className="text-muted">:</span>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={e => onTimeChange('minute', e.target.value)}
                            className="w-10 sm:w-12 bg-transparent text-center py-1.5 text-sm text-text focus:outline-none"
                            placeholder="MM"
                            aria-label="Minutos"
                        />
                        <span className="text-muted">:</span>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={seconds}
                            onChange={e => onTimeChange('second', e.target.value)}
                            className="w-10 sm:w-12 bg-transparent text-center py-1.5 text-sm text-text focus:outline-none"
                            placeholder="SS"
                            aria-label="Segundos"
                        />
                    </div>

                    {/* AM/PM Toggle */}
                    <div
                        className="flex bg-surface border border-border rounded-md overflow-hidden shrink-0"
                        role="radiogroup"
                        aria-label="AM/PM"
                    >
                        <button
                            type="button"
                            role="radio"
                            aria-checked={ampm === 'AM'}
                            onClick={() => onTimeChange('ampm', 'AM')}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${ampm === 'AM' ? 'bg-primary text-white' : 'text-muted hover:text-text'
                                }`}
                        >
                            AM
                        </button>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={ampm === 'PM'}
                            onClick={() => onTimeChange('ampm', 'PM')}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${ampm === 'PM' ? 'bg-primary text-white' : 'text-muted hover:text-text'
                                }`}
                        >
                            PM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
