import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tag as IconTag, Plus, Trash2, X } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

const COLORS = [
    { name: 'Blue', value: 'blue' },
    { name: 'Red', value: 'red' },
    { name: 'Green', value: 'green' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
    { name: 'Indigo', value: 'indigo' },
    { name: 'Gray', value: 'gray' },
];

const COLOR_STYLES = {
    blue: 'bg-blue-500/20 text-blue-500',
    red: 'bg-red-500/20 text-red-500',
    green: 'bg-green-500/20 text-green-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
    purple: 'bg-purple-500/20 text-purple-500',
    pink: 'bg-pink-500/20 text-pink-500',
    indigo: 'bg-indigo-500/20 text-indigo-500',
    gray: 'bg-gray-500/20 text-gray-500',
};

export default function TagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTag, setNewTag] = useState({ name: '', color: 'blue' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await axios.get(`${API_URL}/tags`);
            setTags(res.data);
        } catch (error) {
            console.error("Error fetching tags", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTag.name.trim()) return;

        try {
            await axios.post(`${API_URL}/tags`, newTag);
            setNewTag({ name: '', color: 'blue' });
            setShowForm(false);
            fetchTags();
        } catch (error) {
            console.error(error);
            alert('Error creando etiqueta (quizás ya existe)');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar etiqueta? Se desvinculará de las transacciones.')) return;
        try {
            await axios.delete(`${API_URL}/tags/${id}`);
            fetchTags();
        } catch (error) {
            console.error(error);
            alert('Error eliminando etiqueta');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Cargando categorías...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text">Categorías y Etiquetas</h2>
                <p className="text-muted">Gestiona las etiquetas para organizar tus movimientos.</p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-text text-lg flex items-center gap-2">
                        <IconTag size={20} className="text-primary" />
                        Mis Etiquetas
                    </h3>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                        <Plus size={16} /> Nueva Etiqueta
                    </button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="mb-8 bg-background p-4 rounded-lg border border-border animate-in fade-in slide-in-from-top-2">
                        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs text-muted mb-1">Nombre</label>
                                <input
                                    type="text" required
                                    value={newTag.name}
                                    onChange={e => setNewTag({ ...newTag, name: e.target.value })}
                                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                                    placeholder="Ej. Comida, Transporte..."
                                    autoFocus
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <label className="block text-xs text-muted mb-1">Color</label>
                                <select
                                    value={newTag.color}
                                    onChange={e => setNewTag({ ...newTag, color: e.target.value })}
                                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                                >
                                    {COLORS.map(c => (
                                        <option key={c.value} value={c.value}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button type="submit" className="flex-1 md:flex-none bg-secondary text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-bold">
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 md:flex-none bg-surface border border-border text-text px-4 py-2 rounded-md hover:bg-background transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tags Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {tags.map(tag => (
                        <div key={tag.id} className="group relative bg-background border border-border p-4 rounded-lg flex flex-col items-center justify-center text-center hover:border-text transition-colors cursor-default">
                            <button
                                onClick={() => handleDelete(tag.id)}
                                className="absolute top-2 right-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>

                            <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${COLOR_STYLES[tag.color] || COLOR_STYLES['blue']}`}>
                                <IconTag size={16} />
                            </div>
                            <span className="font-medium text-text text-sm truncate w-full px-2" title={tag.name}>
                                {tag.name}
                            </span>
                            <span className="text-xs text-muted mt-1">
                                {tag.transactions ? tag.transactions.length : 0} usos
                            </span>

                            {/* Clickable Overlay */}
                            <div
                                className="absolute inset-0 cursor-pointer z-0"
                                onClick={() => setSelectedTag(tag)}
                            />
                        </div>
                    ))}
                </div>

                {tags.length === 0 && !loading && (
                    <div className="text-center py-10 text-muted">
                        No tienes etiquetas creadas.
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            {selectedTag && (
                <TransactionsModal
                    tag={selectedTag}
                    onClose={() => setSelectedTag(null)}
                />
            )}
        </div>
    );
}
