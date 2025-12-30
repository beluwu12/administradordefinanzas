/**
 * TransactionForm Component
 * Based on appuidesktop/add_transaction_form template
 * 
 * Features:
 * - Toggle switch for income/expense
 * - Large amount input with icon
 * - Grid layout for date/currency
 * - Tag selector
 * - Pink accent color
 */

import React, { useState, useEffect } from 'react';
import api from '../api';
import { useTransactionDate } from '../utils/useTransactionDate';
import { toUTCISOString, getCurrentLocalDatetime, utcToLocalDatetime } from '../utils/dateUtils';
import { texts } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { useTags } from '../context/TagsContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';

// Extracted components
import DateTimeInput from './common/DateTimeInput';
import CurrencySelector from './common/CurrencySelector';
import TagSelector from './common/TagSelector';

export default function TransactionForm({ onClose, onSuccess, initialData = null }) {
    const { user } = useAuth();
    const { tags: availableTags } = useTags();
    const countryConfig = getCountryConfig(user?.country || 'VE');
    const userIsDual = isDualCurrency(user?.country || 'VE');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState(() => {
        const initialDate = initialData?.date
            ? utcToLocalDatetime(initialData.date)
            : getCurrentLocalDatetime();

        return {
            type: initialData?.type || 'EXPENSE',
            amount: initialData?.amount || '',
            currency: initialData?.currency || user?.defaultCurrency || countryConfig.defaultCurrency,
            exchangeRate: initialData?.exchangeRate || '',
            description: initialData?.description || '',
            source: initialData?.source || '',
            date: initialDate,
            tags: Array.isArray(initialData?.tags) ? initialData.tags.map(t => t.id) : []
        };
    });

    const { datePart, hours12, minutes, seconds, ampm, updateTime, setDatePart } = useTransactionDate(
        formData.date,
        (newDate) => setFormData(prev => ({ ...prev, date: newDate }))
    );

    // Auto-fetch exchange rate for VES
    useEffect(() => {
        const fetchRate = async () => {
            if (formData.currency === 'VES' && !formData.exchangeRate) {
                try {
                    const res = await api.get('/exchange-rate/usd-ves');
                    const rateData = res.data;
                    if (rateData?.rate) {
                        setFormData(prev => ({ ...prev, exchangeRate: rateData.rate }));
                    }
                } catch {
                    // Silently fail
                }
            }
        };
        fetchRate();
    }, [formData.currency]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleTag = (tagId) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tagId)
                ? prev.tags.filter(id => id !== tagId)
                : [...prev.tags, tagId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                date: toUTCISOString(formData.date),
                amount: parseFloat(formData.amount),
                exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
            };

            if (initialData) {
                await api.put(`/transactions/${initialData.id}`, payload);
            } else {
                await api.post('/transactions', payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || texts.common.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex justify-between items-start border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            {initialData ? texts.transactions.editTitle : 'Nueva Transacción'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Registra un ingreso o gasto
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-foreground transition-colors p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Type Toggle */}
                <div className="px-6 pt-4">
                    <div className="flex p-1 rounded-xl bg-gray-50 border border-gray-200">
                        <button
                            type="button"
                            onClick={() => updateField('type', 'INCOME')}
                            className={`flex-1 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${formData.type === 'INCOME'
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="material-symbols-outlined mr-2 text-[18px]">arrow_downward</span>
                            Ingreso
                        </button>
                        <button
                            type="button"
                            onClick={() => updateField('type', 'EXPENSE')}
                            className={`flex-1 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${formData.type === 'EXPENSE'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="material-symbols-outlined mr-2 text-[18px]">arrow_upward</span>
                            Gasto
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5 overflow-y-auto flex-1">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Amount Input - Large */}
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-700 text-sm font-semibold uppercase tracking-wider">
                            Monto
                        </label>
                        <div className="relative flex items-center">
                            <div className="absolute left-4 text-gray-400 pointer-events-none flex items-center justify-center">
                                <span className="material-symbols-outlined">attach_money</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={e => updateField('amount', e.target.value)}
                                className="w-full bg-white border border-gray-200 text-foreground text-3xl font-bold rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-300 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Currency & Exchange Rate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-700 text-sm font-medium">Moneda</label>
                            <CurrencySelector
                                value={formData.currency}
                                onChange={(val) => updateField('currency', val)}
                                currencies={countryConfig.currencies}
                                isDualCurrency={userIsDual}
                                defaultCurrency={countryConfig.defaultCurrency}
                            />
                        </div>
                        {userIsDual && formData.currency === 'VES' && (
                            <div className="flex flex-col gap-2">
                                <label className="text-gray-700 text-sm font-medium">
                                    {texts.transactions.exchangeRate}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400 text-xl">currency_exchange</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.exchangeRate}
                                        onChange={e => updateField('exchangeRate', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400 h-12"
                                        placeholder="45.50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date & Source */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-700 text-sm font-medium">Fecha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-400 text-xl">calendar_month</span>
                                </div>
                                <input
                                    type="date"
                                    value={datePart}
                                    onChange={(e) => setDatePart(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-12"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-700 text-sm font-medium">Fuente</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-400 text-xl">credit_card</span>
                                </div>
                                <input
                                    type="text"
                                    value={formData.source}
                                    onChange={e => updateField('source', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400 h-12"
                                    placeholder="Banesco, Efectivo..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-700 text-sm font-medium">Descripción</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400 resize-none text-sm leading-normal"
                            placeholder="¿Para qué fue esta transacción?"
                            rows="2"
                        />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-gray-700 text-sm font-medium">Categoría</label>
                        </div>
                        <TagSelector
                            availableTags={availableTags}
                            selectedTags={formData.tags}
                            onToggleTag={toggleTag}
                            onTagCreated={(tagId) => updateField('tags', [...formData.tags, tagId])}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-pink-700 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    Guardar Transacción
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
