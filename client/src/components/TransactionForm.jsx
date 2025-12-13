import { useTransactionDate } from '../utils/useTransactionDate';

export default function TransactionForm({ onClose, onSuccess, initialData = null }) {
    // 1. SAFE STATE INITIALIZATION
    const [formData, setFormData] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const defaultDate = now.toISOString().slice(0, 19);

        let initialDate = defaultDate;
        if (initialData?.date) {
            try {
                // Try to keep the date, but ensure local ISO string
                const d = new Date(initialData.date);
                if (!isNaN(d.getTime())) {
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    initialDate = d.toISOString().slice(0, 19);
                }
            } catch (e) { console.error("Date init error", e); }
        }

        return {
            type: initialData?.type || 'EXPENSE',
            amount: initialData?.amount || '',
            currency: initialData?.currency || 'USD',
            exchangeRate: initialData?.exchangeRate || '',
            description: initialData?.description || '',
            source: initialData?.source || '',
            date: initialDate,
            tags: Array.isArray(initialData?.tags) ? initialData.tags.map(t => t.id) : []
        };
    });

    const [availableTags, setAvailableTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [showTagInput, setShowTagInput] = useState(false);
    const [error, setError] = useState(null);

    // Date Hook
    const { datePart, hours12, minutes, seconds, ampm, updateTime, setDatePart } = useTransactionDate(
        formData.date,
        (newDate) => setFormData(prev => ({ ...prev, date: newDate }))
    );

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await axios.get(`${API_URL}/tags`);
            if (Array.isArray(res.data)) {
                setAvailableTags(res.data);
            } else {
                setAvailableTags([]);
            }
        } catch (error) {
            console.error('Error fetching tags', error);
            setAvailableTags([]);
        }
    };

    // Auto-fetch Rate Effect
    useEffect(() => {
        const fetchRate = async () => {
            if (formData.currency === 'VES' && !formData.exchangeRate) {
                try {
                    const res = await axios.get(`${API_URL}/exchange-rate/usd-ves`);
                    if (res.data && res.data.rate) {
                        setFormData(prev => ({ ...prev, exchangeRate: res.data.rate }));
                    }
                } catch (e) {
                    console.error("Could not fetch automatic rate", e);
                }
            }
        };
        fetchRate();
    }, [formData.currency]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
            };

            if (initialData) {
                await axios.put(`${API_URL}/transactions/${initialData.id}`, payload);
            } else {
                await axios.post(`${API_URL}/transactions`, payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            setError(texts.common.error);
        }
    };

    const handleCreateTag = async () => {
        if (!newTag.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/tags`, { name: newTag, color: 'blue' });
            setAvailableTags(prev => [...prev, res.data]);
            setFormData(prev => ({ ...prev, tags: [...prev.tags, res.data.id] }));
            setNewTag('');
            setShowTagInput(false);
        } catch (error) {
            console.error('Error creating tag', error);
        }
    };

    const toggleTag = (tagId) => {
        setFormData(prev => {
            if (prev.tags.includes(tagId)) {
                return { ...prev, tags: prev.tags.filter(id => id !== tagId) };
            } else {
                return { ...prev, tags: [...prev.tags, tagId] };
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text">{initialData ? texts.transactions.editTitle : texts.transactions.addTitle}</h2>
                    <button onClick={onClose} className="text-muted hover:text-text transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {error && <div className="bg-danger/10 text-danger p-3 rounded text-sm">{error}</div>}

                    {/* Type Toggle */}
                    <div className="grid grid-cols-2 gap-2 bg-background p-1 rounded-lg border border-border">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                            className={`py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'INCOME' ? 'bg-secondary/20 text-secondary' : 'text-muted hover:text-text'
                                }`}
                        >
                            {texts.transactions.income}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                            className={`py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'EXPENSE' ? 'bg-danger/20 text-danger' : 'text-muted hover:text-text'
                                }`}
                        >
                            {texts.transactions.expense}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted mb-1">{texts.transactions.amount}</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted mb-1">Moneda</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="VES">VES (Bs.)</option>
                            </select>
                        </div>
                    </div>



                    {formData.currency === 'VES' && (
                        <div>
                            <label className="block text-xs font-medium text-muted mb-1">{texts.transactions.exchangeRate}</label>
                            <input
                                type="number" step="0.01"
                                value={formData.exchangeRate}
                                onChange={e => setFormData({ ...formData, exchangeRate: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej. 45.50"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">{texts.transactions.description}</label>
                        <input
                            type="text" required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder={texts.transactions.descriptionPlaceholder}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">{texts.transactions.source}</label>
                        <input
                            type="text"
                            value={formData.source}
                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Ej. Banesco, Efectivo, Zelle"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">{texts.transactions.date}</label>
                        <div className="bg-background border border-border rounded-lg p-3">
                            <div className="flex flex-col gap-2">
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        value={datePart}
                                        onChange={e => setDatePart(e.target.value)}
                                        className="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-sm text-text"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-surface border border-border rounded-md">
                                        <input
                                            type="number" min="1" max="12"
                                            value={hours12}
                                            onChange={e => updateTime('hour', e.target.value)}
                                            className="w-12 bg-transparent text-center py-1.5 text-sm text-text focus:outline-none"
                                            placeholder="HH"
                                        />
                                        <span className="text-muted">:</span>
                                        <input
                                            type="number" min="0" max="59"
                                            value={minutes}
                                            onChange={e => updateTime('minute', e.target.value)}
                                            className="w-12 bg-transparent text-center py-1.5 text-sm text-text focus:outline-none"
                                            placeholder="MM"
                                        />
                                        <span className="text-muted">:</span>
                                        <input
                                            type="number" min="0" max="59"
                                            value={seconds}
                                            onChange={e => updateTime('second', e.target.value)}
                                            className="w-12 bg-transparent text-center py-1.5 text-sm text-text focus:outline-none"
                                            placeholder="SS"
                                        />
                                    </div>
                                    <div className="flex bg-surface border border-border rounded-md overflow-hidden shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => updateTime('ampm', 'AM')}
                                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${ampm === 'AM' ? 'bg-primary text-white' : 'text-muted hover:text-text'}`}
                                        >
                                            AM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateTime('ampm', 'PM')}
                                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${ampm === 'PM' ? 'bg-primary text-white' : 'text-muted hover:text-text'}`}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-medium text-muted">{texts.transactions.category}</label>
                            <button
                                type="button"
                                onClick={() => setShowTagInput(!showTagInput)}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus size={12} /> {texts.tags.addTitle}
                            </button>
                        </div>

                        {showTagInput && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1 text-sm"
                                    placeholder={texts.tags.name}
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateTag}
                                    className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm font-medium hover:bg-primary/30"
                                >
                                    {texts.tags.create}
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(availableTags) && availableTags.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1 rounded-full text-xs transition-colors border ${formData.tags.includes(tag.id)
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-transparent text-muted border-border hover:border-text'
                                        }`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors mt-6"
                    >
                        {initialData ? texts.transactions.save : texts.transactions.save}
                    </button>
                </form>
            </div>
        </div>
    );
}
