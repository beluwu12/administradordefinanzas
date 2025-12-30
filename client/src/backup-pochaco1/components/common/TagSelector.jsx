/**
 * TagSelector Component
 * Updated styling for pink theme template
 * Displays tags as grid cards instead of pills
 */

import React, { useState } from 'react';
import { texts } from '../../i18n/es';
import { useTagCreation } from '../../hooks/useTagCreation';

// Icon mapping for common tag categories
const tagIcons = {
    'comida': 'restaurant',
    'food': 'restaurant',
    'transporte': 'directions_car',
    'transport': 'directions_car',
    'compras': 'shopping_bag',
    'shopping': 'shopping_bag',
    'ocio': 'movie',
    'entertainment': 'movie',
    'vivienda': 'cottage',
    'housing': 'cottage',
    'servicios': 'bolt',
    'utilities': 'bolt',
    'salud': 'health_and_safety',
    'health': 'health_and_safety',
    'educacion': 'school',
    'education': 'school',
    'default': 'sell'
};

function getTagIcon(tagName) {
    const normalized = tagName.toLowerCase();
    for (const [key, icon] of Object.entries(tagIcons)) {
        if (normalized.includes(key)) return icon;
    }
    return tagIcons.default;
}

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
            {/* Tag Error */}
            {tagError && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 p-2 rounded-xl text-xs mb-3">
                    {tagError}
                </div>
            )}

            {/* Inline Tag Creation */}
            {showInput && (
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-gray-400 text-xl">sell</span>
                        </div>
                        <input
                            type="text"
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400 h-12"
                            placeholder="Nueva etiqueta..."
                            disabled={isCreating}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={isCreating || !newTagName.trim()}
                        className="px-4 h-12 bg-primary text-white rounded-xl font-bold text-sm hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isCreating && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                        {isCreating ? '' : 'Crear'}
                    </button>
                </div>
            )}

            {/* Tag Grid - Card style like template */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.isArray(availableTags) && availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.id);
                    const icon = getTagIcon(tag.name);

                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => onToggleTag(tag.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isSelected
                                    ? 'border-primary bg-pink-50 ring-1 ring-primary'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                        >
                            <div className={`size-8 rounded-full flex items-center justify-center mb-2 ${isSelected ? 'bg-primary/20' : 'bg-gray-100'
                                }`}>
                                <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-primary' : 'text-gray-500'
                                    }`}>{icon}</span>
                            </div>
                            <span className={`text-xs font-medium truncate w-full text-center ${isSelected ? 'text-primary' : 'text-gray-700'
                                }`}>{tag.name}</span>
                        </button>
                    );
                })}

                {/* Add New Tag Button */}
                <button
                    type="button"
                    onClick={() => setShowInput(!showInput)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-primary hover:bg-pink-50/50 transition-all"
                >
                    <div className="size-8 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                        <span className="material-symbols-outlined text-[20px] text-gray-400">add</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">Nueva</span>
                </button>
            </div>

            {(!availableTags || availableTags.length === 0) && !showInput && (
                <p className="text-center text-sm text-gray-500 mt-3">
                    Crea tu primera categoría usando el botón +
                </p>
            )}
        </div>
    );
}
