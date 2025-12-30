import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ModernLayout - FinanceApp Design v2.0
 * Pink themed (#db0f79) with Roboto font, based on provided HTML templates
 */

const navItems = [
    { path: '/', icon: 'dashboard', label: 'Panel' },
    { path: '/transactions', icon: 'list', label: 'Movimientos' },
    { path: '/budget', icon: 'account_balance_wallet', label: 'Presupuesto' },
    { path: '/goals', icon: 'flag', label: 'Metas' },
    { path: '/tags', icon: 'sell', label: 'Etiquetas' },
];

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                flex flex-col w-64 h-full border-r border-gray-200 bg-white flex-shrink-0
                fixed inset-y-0 left-0 z-50 shadow-sm
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:relative md:shadow-none
            `}>
                {/* Mobile close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 md:hidden text-gray-500 hover:text-foreground transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                        F
                    </div>
                    <h1 className="text-foreground text-lg font-bold tracking-tight">FinControl</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 mt-2 flex flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${isActive
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/20'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-foreground'
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined ${isActive ? '' : 'text-gray-400 group-hover:text-primary'}`}
                                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    {item.icon}
                                </span>
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="mt-auto p-4 border-t border-gray-200">
                    <Link
                        to="/settings"
                        onClick={handleNavClick}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-foreground transition-colors mb-4"
                    >
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">settings</span>
                        <span className="text-sm font-medium">Ajustes</span>
                    </Link>

                    {/* User profile section */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-700 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-bold leading-tight truncate">
                                {user?.name || 'Usuario'}
                            </p>
                            <p className="text-gray-500 text-xs font-medium">Plan Básico</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Cerrar sesión"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

const Header = ({ title, onMenuClick }) => {
    return (
        <header className="flex items-center justify-between bg-white/80 backdrop-blur-md px-6 py-4 flex-shrink-0 z-10 sticky top-0 border-b border-gray-200">
            {/* Mobile menu button + title */}
            <div className="flex items-center gap-4 text-foreground md:hidden">
                <button onClick={onMenuClick} className="text-gray-500 hover:text-foreground transition-colors">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <span className="font-bold text-lg">{title}</span>
            </div>

            {/* Desktop - empty, title in content area */}
            <div className="hidden md:block"></div>

            {/* Right side actions */}
            <div className="flex-1 flex justify-end gap-6 items-center">
                {/* Sync status */}
                <div className="hidden md:flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                    Sincronizado
                </div>

                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <button className="flex items-center justify-center rounded-xl size-10 hover:bg-gray-50 text-gray-500 transition-colors relative border border-transparent hover:border-gray-100">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>

                    {/* Settings link */}
                    <Link
                        to="/settings"
                        className="flex items-center justify-center rounded-xl size-10 hover:bg-gray-50 text-gray-500 transition-colors border border-transparent hover:border-gray-100"
                        title="Configuración"
                    >
                        <span className="material-symbols-outlined">settings</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

const Layout = ({ children, title = 'Dashboard' }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="bg-background text-foreground font-display antialiased overflow-hidden h-screen flex">
            <Sidebar isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">
                <Header
                    title={title}
                    onMenuClick={() => setDrawerOpen(true)}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto flex flex-col gap-6">
                        {children}
                    </div>
                    <div className="h-12 w-full"></div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
