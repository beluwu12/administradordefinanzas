import React, { useEffect, useState, useMemo } from 'react';
import api, { unwrapData } from '../api';
import TransactionsModal from '../components/TransactionsModal';
import { useTagCreation } from '../hooks/useTagCreation';

const COLORS = [
    { name: 'Blue', value: 'blue', hex: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-600' },
    { name: 'Red', value: 'red', hex: '#EF4444', bg: 'bg-red-100', text: 'text-red-600' },
    { name: 'Green', value: 'green', hex: '#22C55E', bg: 'bg-green-100', text: 'text-green-600' },
    { name: 'Yellow', value: 'yellow', hex: '#FACC15', bg: 'bg-yellow-100', text: 'text-yellow-600' },
    { name: 'Purple', value: 'purple', hex: '#A855F7', bg: 'bg-purple-100', text: 'text-purple-600' },
    { name: 'Pink', value: 'pink', hex: '#EC4899', bg: 'bg-pink-100', text: 'text-pink-600' },
    { name: 'Teal', value: 'teal', hex: '#14B8A6', bg: 'bg-teal-100', text: 'text-teal-600' },
    { name: 'Orange', value: 'orange', hex: '#F97316', bg: 'bg-orange-100', text: 'text-orange-600' },
];

const ICONS = [
    'sell', 'shopping_cart', 'restaurant', 'directions_car', 'cottage',
    'bolt', 'health_and_safety', 'school', 'movie', 'fitness_center',
    'savings', 'flight', 'pets', 'checkroom', 'local_bar'
];

export default function TagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const { createTag, isCreating } = useTagCreation();

    // Form State
    const [formData, setFormData] = useState({ name: '', color: 'blue', icon: 'sell' });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await api.get('/tags');
            // Use unwrapData to extract data from standardized response
            const tagsData = unwrapData(res);
            setTags(tagsData || []);
        } catch (error) {
            console.error("Error fetching tags", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            if (isEditing) {
                // Update implementation (assuming backend supports PUT /tags/:id)
                // If not supported, we might need to adjust or add the endpoint
                await api.put(`/tags/${editId}`, formData);
            } else {
                await createTag(formData.name, formData.color); // The hook might be simple, let's use direct API for full control if needed
                // Re-implementing create to support color/icon if hook doesn't
                if (!isEditing) api.post('/tags', formData);
            }

            resetForm();
            fetchTags();
        } catch (error) {
            console.error(error);
            // Fallback for hook limitation if needed
            if (!isEditing) fetchTags();
        }
    };

    // Override handleSave to purely use API to ensure color support 
    // since useTagCreation might be limited
    const onSaveSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/tags/${editId}`, formData);
            } else {
                await api.post('/tags', formData);
            }
            resetForm();
            fetchTags();
        } catch (error) {
            console.error("Error saving tag", error);
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar etiqueta? Se desvinculará de las transacciones.')) return;
        try {
            await api.delete(`/tags/${id}`);
            fetchTags();
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', color: 'blue', icon: 'sell' });
        setIsEditing(false);
        setEditId(null);
        setShowForm(false);
    };

    const openEdit = (tag) => {
        setFormData({ name: tag.name, color: tag.color || 'blue', icon: 'sell' }); // Backend doesn't store icon seemingly?
        setIsEditing(true);
        setEditId(tag.id);
        setShowForm(true);
    };

    const filteredTags = useMemo(() => {
        return tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [tags, searchQuery]);

    // Stats
    const totalTags = tags.length;
    const mostUsed = useMemo(() => {
        if (!tags.length) return null;
        return tags.reduce((prev, current) =>
            (current.transactions?.length || 0) > (prev.transactions?.length || 0) ? current : prev
        );
    }, [tags]);

    // Assuming tags with 0 transactions are "Unused" (replacing Uncategorized logic for now)
    const unusedTags = tags.filter(t => !t.transactions || t.transactions.length === 0).length;

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando etiquetas...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-dashed border-gray-200">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Gestión de Etiquetas</h1>
                    <p className="text-gray-500 text-base">Organiza tus patrones de gasto con categorías personalizadas.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 rounded-xl h-12 px-6 bg-black hover:bg-gray-800 transition-colors text-white text-sm font-bold tracking-wide shadow-lg shadow-gray-200"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span className="truncate">Crear Nueva Etiqueta</span>
                </button>
            </div>

            {/* Stats Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total */}
                <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Etiquetas</p>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="material-symbols-outlined text-gray-400 text-lg">sell</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                        <p className="text-gray-900 text-3xl font-bold">{totalTags}</p>
                    </div>
                </div>

                {/* Most Used */}
                <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Más Usada</p>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="material-symbols-outlined text-gray-400 text-lg">trending_up</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                        <p className="text-gray-900 text-3xl font-bold truncate">
                            {mostUsed ? mostUsed.name : '-'}
                        </p>
                        {mostUsed && (
                            <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                {mostUsed.transactions?.length || 0} usos
                            </span>
                        )}
                    </div>
                </div>

                {/* Unused */}
                <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Sin Uso</p>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="material-symbols-outlined text-gray-400 text-lg">help_outline</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                        <p className="text-gray-900 text-3xl font-bold">{unusedTags}</p>
                        {unusedTags > 0 && (
                            <span className="flex items-center text-gray-500 text-xs font-bold bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                Disponibles
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={resetForm}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                            <form onSubmit={onSaveSubmit} className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    {isEditing ? 'Editar Etiqueta' : 'Crear Nueva Etiqueta'}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black transition-colors"
                                            placeholder="Ej. Viajes"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                        <div className="flex flex-wrap gap-3">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color: c.value })}
                                                    className={`w-8 h-8 rounded-full transition-all ${c.bg} ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-105'
                                                        }`}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Visual)</label>
                                        <div className="grid grid-cols-8 gap-2 p-2 border border-gray-100 rounded-xl bg-gray-50 max-h-32 overflow-y-auto">
                                            {ICONS.map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, icon })}
                                                    className={`aspect-square flex items-center justify-center rounded-lg transition-colors ${formData.icon === icon ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-gray-900 hover:bg-white'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 rounded-xl text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-pink-700 transition-colors shadow-lg shadow-primary/20"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* List Header & Search */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative flex items-center h-12 w-full rounded-xl bg-white border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black/5 transition-all shadow-sm">
                        <div className="absolute left-4 text-gray-400 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full bg-transparent border-none text-gray-900 placeholder:text-gray-400 pl-12 pr-4 text-sm rounded-xl focus:ring-0"
                            placeholder="Buscar etiquetas existentes..."
                        />
                    </div>
                </div>
            </div>

            {/* Tags List */}
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <div className="col-span-6 md:col-span-3">Nombre</div>
                    <div className="col-span-3 hidden md:block">Color</div>
                    <div className="col-span-3">Txns Asociadas</div>
                    <div className="col-span-3 md:col-span-3 text-right">Acciones</div>
                </div>

                {/* Rows */}
                {filteredTags.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No se encontraron etiquetas.</div>
                ) : (
                    filteredTags.map(tag => {
                        const colorInfo = COLORS.find(c => c.value === tag.color) || COLORS[0];
                        const count = tag.transactions?.length || 0;
                        // Mock progress bar width based on max count
                        const maxCount = mostUsed?.transactions?.length || 1;
                        const percentage = mostUsed ? Math.round((count / maxCount) * 100) : 0;

                        return (
                            <div key={tag.id} className="group grid grid-cols-12 gap-4 items-center border-b last:border-0 border-gray-50 px-6 py-4 hover:bg-gray-50 transition-colors">

                                {/* Name & Icon */}
                                <div className="col-span-6 md:col-span-3 flex items-center gap-3">
                                    <div className={`size-8 rounded-lg ${colorInfo.bg} flex items-center justify-center ${colorInfo.text}`}>
                                        <span className="material-symbols-outlined text-[18px]">sell</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedTag(tag)}>
                                        {tag.name}
                                    </p>
                                </div>

                                {/* Color Code */}
                                <div className="col-span-3 hidden md:block">
                                    <span className="text-xs font-mono px-2 py-1 rounded bg-gray-100 text-gray-500 border border-gray-200">
                                        {colorInfo.hex}
                                    </span>
                                </div>

                                {/* Usage */}
                                <div className="col-span-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-900 w-8">{count}</span>
                                        <div className="h-2 w-24 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                                            <div
                                                className="h-full bg-primary/70 transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 md:col-span-3 flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(tag)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-500 hover:text-gray-900 shadow-sm transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        <span className="hidden xl:inline">Editar</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tag.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                        title="Eliminar"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Transactions Modal */}
            {selectedTag && (
                <TransactionsModal
                    tag={selectedTag}
                    onClose={() => setSelectedTag(null)}
                />
            )}
        </div>
    );
}
