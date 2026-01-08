/**
 * TransactionForm Component - Refactored with Design System
 */
import React, { useState, useEffect } from 'react';
import api from '../api';
import { useTransactionDate } from '../utils/useTransactionDate';
import { toUTCISOString, getCurrentLocalDatetime, utcToLocalDatetime } from '../utils/dateUtils';
import { texts } from '../i18n/es';
import { useAuth } from '../context/AuthContext';
import { useTags } from '../context/TagsContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';

// Design System Primitives
import { Button, Modal, ModalHeader, ModalContent, ModalFooter, Input, InputLabel, Textarea, TransactionTypeToggle } from '@/design-system';

// Extracted components
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

    const { datePart, setDatePart } = useTransactionDate(
        formData.date,
        (newDate) => setFormData(prev => ({ ...prev, date: newDate }))
    );

    useEffect(() => {
        const fetchRate = async () => {
            if (formData.currency === 'VES' && !formData.exchangeRate) {
                try {
                    const res = await api.get('/exchange-rate/usd-ves');
                    if (res.data?.rate) {
                        setFormData(prev => ({ ...prev, exchangeRate: res.data.rate }));
                    }
                } catch { /* silent */ }
            }
        };
        fetchRate();
    }, [formData.currency]);

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

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
        <Modal onClose={onClose}>
            <ModalHeader
                title={initialData ? texts.transactions.editTitle : 'Nueva Transacción'}
                description="Registra un ingreso o gasto"
                onClose={onClose}
            />

            <form onSubmit={handleSubmit}>
                <ModalContent className="space-y-5">
                    {/* Type Toggle */}
                    <TransactionTypeToggle
                        value={formData.type}
                        onChange={(val) => updateField('type', val)}
                    />

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Amount Input */}
                    <div>
                        <InputLabel className="uppercase tracking-wider">Monto</InputLabel>
                        <Input
                            type="number"
                            step="0.01"
                            required
                            icon="attach_money"
                            value={formData.amount}
                            onChange={e => updateField('amount', e.target.value)}
                            className="text-3xl font-bold py-4"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Currency & Exchange Rate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel>Moneda</InputLabel>
                            <CurrencySelector
                                value={formData.currency}
                                onChange={(val) => updateField('currency', val)}
                                currencies={countryConfig.currencies}
                                isDualCurrency={userIsDual}
                                defaultCurrency={countryConfig.defaultCurrency}
                            />
                        </div>
                        {userIsDual && formData.currency === 'VES' && (
                            <div>
                                <InputLabel>{texts.transactions.exchangeRate}</InputLabel>
                                <Input
                                    type="number"
                                    step="0.01"
                                    icon="currency_exchange"
                                    value={formData.exchangeRate}
                                    onChange={e => updateField('exchangeRate', e.target.value)}
                                    placeholder="45.50"
                                />
                            </div>
                        )}
                    </div>

                    {/* Date & Source */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel>Fecha</InputLabel>
                            <Input
                                type="date"
                                icon="calendar_month"
                                value={datePart}
                                onChange={(e) => setDatePart(e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel>Fuente</InputLabel>
                            <Input
                                type="text"
                                icon="credit_card"
                                value={formData.source}
                                onChange={e => updateField('source', e.target.value)}
                                placeholder="Banesco, Efectivo..."
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <InputLabel>Descripción</InputLabel>
                        <Textarea
                            required
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder="¿Para qué fue esta transacción?"
                            rows="2"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <InputLabel>Categoría</InputLabel>
                        <TagSelector
                            availableTags={availableTags}
                            selectedTags={formData.tags}
                            onToggleTag={toggleTag}
                            onTagCreated={(tagId) => updateField('tags', [...formData.tags, tagId])}
                        />
                    </div>
                </ModalContent>

                <ModalFooter>
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isSubmitting} icon="check">
                        Guardar Transacción
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
