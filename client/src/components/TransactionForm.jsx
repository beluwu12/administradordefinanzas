/**
 * TransactionForm Component
 * 
 * REFACTORED: Following SRP (Single Responsibility Principle)
 * - DateTimeInput: Handles date/time selection
 * - CurrencySelector: Handles currency dropdown
 * - TagSelector: Handles tag selection and creation
 * - TransactionTypeToggle: Handles INCOME/EXPENSE toggle
 * 
 * This component now focuses only on:
 * - Form state management
 * - Form submission
 * - Layout orchestration
 */

import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, Loader2 } from 'lucide-react';
import { useTransactionDate } from '../utils/useTransactionDate';
import { toUTCISOString, getCurrentLocalDatetime, utcToLocalDatetime } from '../utils/dateUtils';
import { texts } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { useTags } from '../context/TagsContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';

// Extracted components (SRP)
import DateTimeInput from './common/DateTimeInput';
import CurrencySelector from './common/CurrencySelector';
import TagSelector from './common/TagSelector';
import TransactionTypeToggle from './common/TransactionTypeToggle';

export default function TransactionForm({ onClose, onSuccess, initialData = null }) {
    const { user } = useAuth();
    const { tags: availableTags } = useTags();
    const countryConfig = getCountryConfig(user?.country || 'VE');
    const userIsDual = isDualCurrency(user?.country || 'VE');

    // Loading state for form submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Form state initialization
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

    // Date Hook
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
                    // Silently fail - user can enter rate manually
                }
            }
        };
        fetchRate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.currency]);

    // Form field updaters
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

    // Form submission
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
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-form-title"
        >
            <div className="bg-surface border border-border w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
                    <h2 id="transaction-form-title" className="text-lg sm:text-xl font-bold text-text">
                        {initialData ? texts.transactions.editTitle : texts.transactions.addTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-text transition-colors p-1"
                        aria-label="Cerrar formulario"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-danger/10 text-danger p-3 rounded text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Type Toggle */}
                    <TransactionTypeToggle
                        value={formData.type}
                        onChange={(type) => updateField('type', type)}
                    />

                    {/* Amount & Currency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount" className="block text-xs font-medium text-muted mb-1">
                                {texts.transactions.amount}
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={e => updateField('amount', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label htmlFor="currency" className="block text-xs font-medium text-muted mb-1">
                                Moneda
                            </label>
                            <CurrencySelector
                                value={formData.currency}
                                onChange={(val) => updateField('currency', val)}
                                currencies={countryConfig.currencies}
                                isDualCurrency={userIsDual}
                                defaultCurrency={countryConfig.defaultCurrency}
                            />
                        </div>
                    </div>

                    {/* Exchange Rate (VES only) */}
                    {userIsDual && formData.currency === 'VES' && (
                        <div>
                            <label htmlFor="exchangeRate" className="block text-xs font-medium text-muted mb-1">
                                {texts.transactions.exchangeRate}
                            </label>
                            <input
                                id="exchangeRate"
                                type="number"
                                step="0.01"
                                value={formData.exchangeRate}
                                onChange={e => updateField('exchangeRate', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej. 45.50"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-xs font-medium text-muted mb-1">
                            {texts.transactions.description}
                        </label>
                        <input
                            id="description"
                            type="text"
                            required
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder={texts.transactions.descriptionPlaceholder}
                        />
                    </div>

                    {/* Source */}
                    <div>
                        <label htmlFor="source" className="block text-xs font-medium text-muted mb-1">
                            {texts.transactions.source}
                        </label>
                        <input
                            id="source"
                            type="text"
                            value={formData.source}
                            onChange={e => updateField('source', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Ej. Banesco, Efectivo, Zelle"
                        />
                    </div>

                    {/* Date & Time */}
                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">
                            {texts.transactions.date}
                        </label>
                        <DateTimeInput
                            datePart={datePart}
                            hours12={hours12}
                            minutes={minutes}
                            seconds={seconds}
                            ampm={ampm}
                            onDateChange={setDatePart}
                            onTimeChange={updateTime}
                        />
                    </div>

                    {/* Tags */}
                    <TagSelector
                        availableTags={availableTags}
                        selectedTags={formData.tags}
                        onToggleTag={toggleTag}
                        onTagCreated={(tagId) => updateField('tags', [...formData.tags, tagId])}
                    />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            texts.transactions.save
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
