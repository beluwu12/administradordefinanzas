/**
 * TagSelector Component
 * Extracted from TransactionForm for SRP compliance
 * Handles tag selection and inline tag creation
 */

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { texts } from '../../i18n/es';
import { useTagCreation } from '../../hooks/useTagCreation';

export default function TagSelector({
    availableTags,
    selectedTags,
    onToggleTag,
    onTagCreated
}) {
    const { createTag, isCreating, error: tagError } = useTagCreation();
    const [newTagName, setNewTagName] = useState('');
    const [showInput, setShowInput] = useState(false);

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        const newTag = await createTag(newTagName);
        if (newTag) {
            onTagCreated(newTag.id);
            setNewTagName('');
            setShowInput(false);
        }
    };

    return (
        <div>
            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-muted">
                    {texts.transactions.category}
                </label>
                <button
                    type="button"
                    onClick={() => setShowInput(!showInput)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    aria-expanded={showInput}
                >
                    <Plus size={12} /> {texts.tags.addTitle}
                </button>
            </div>

            {/* Tag Error */}
            {tagError && (
                <div className="bg-yellow-500/10 text-yellow-600 p-2 rounded text-xs mb-2" role="alert">
                    {tagError}
                </div>
            )}

            {/* Inline Tag Creation */}
            {showInput && (
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-1 text-sm"
                        placeholder={texts.tags.name}
                        aria-label="Nombre de la nueva etiqueta"
                        disabled={isCreating}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                    />
                    <button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={isCreating || !newTagName.trim()}
                        className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm font-medium hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        {isCreating && <Loader2 size={12} className="animate-spin" />}
                        {texts.tags.create}
                    </button>
                </div>
            )}

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Etiquetas disponibles">
                {Array.isArray(availableTags) && availableTags.map(tag => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => onToggleTag(tag.id)}
                        aria-pressed={selectedTags.includes(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors border ${selectedTags.includes(tag.id)
                                ? 'bg-primary text-white border-primary'
                                : 'bg-transparent text-muted border-border hover:border-text'
                            }`}
                    >
                        {tag.name}
                    </button>
                ))}

                {(!availableTags || availableTags.length === 0) && (
                    <span className="text-xs text-muted">No hay etiquetas. Crea una nueva.</span>
                )}
            </div>
        </div>
    );
}
