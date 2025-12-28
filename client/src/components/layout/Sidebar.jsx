import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { texts } from '../../i18n/es';

/**
 * Sidebar - Based on appuidesktop template
 * White background, pink accent, Material Symbols icons
 */
const Sidebar = ({ navItems }) => {
    const { logout } = useAuth();

    return (
        <aside className="hidden md:flex flex-col w-64 h-full border-r border-gray-200 bg-white flex-shrink-0 fixed inset-y-0 left-0 z-50">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                </div>
                <div>
                    <h1 className="text-foreground text-lg font-bold leading-tight tracking-tight">FinControl</h1>
                    <p className="text-primary text-xs font-medium">Plan Pro</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                            ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-500 hover:text-foreground hover:bg-gray-50'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <span
                                    className="material-symbols-outlined text-[22px]"
                                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {getIconName(item.to)}
                                </span>
                                <span className="text-sm font-semibold">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex flex-col gap-4">
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-foreground hover:bg-gray-50 transition-colors"
                >
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-sm font-medium">Ajustes</span>
                </NavLink>
                <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-pink-700 transition-colors shadow-sm shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

// Map routes to Material Symbols icon names
const getIconName = (path) => {
    const icons = {
        '/': 'dashboard',
        '/transactions': 'receipt_long',
        '/tags': 'sell',
        '/budget': 'pie_chart',
        '/goals': 'savings',
    };
    return icons[path] || 'circle';
};

export default Sidebar;
