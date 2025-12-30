import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600'
    };

    return (
        <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 md:bottom-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white ${bgColors[type] || bgColors.info} animate-slideUp`}>
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X size={16} />
            </button>
        </div>
    );
}
