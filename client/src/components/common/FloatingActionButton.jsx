import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingActionButton = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/transactions', { state: { openForm: true } })}
            className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-background rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-300 z-50 animate-in zoom-in group ring-4 ring-primary/20 hover:ring-primary/40"
            aria-label="Agregar transacción"
        >
            <Plus size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
    );
};

export default FloatingActionButton;
