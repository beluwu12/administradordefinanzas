import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ModernLayout - Main shell with Sidebar + Header
 * Matches the appuidesktop design system exactly
 */

const navItems = [
    { path: '/', icon: 'dashboard', label: 'Panel', filled: true },
    { path: '/transactions', icon: 'receipt_long', label: 'Transacciones' },
    { path: '/budget', icon: 'pie_chart', label: 'Presupuesto' },
    { path: '/goals', icon: 'savings', label: 'Metas' },
    { path: '/tags', icon: 'sell', label: 'Etiquetas' },
];

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className="hidden md:flex flex-col w-64 h-full border-r border-card-border bg-bg-sidebar flex-shrink-0">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                </div>
                <div>
                    <h1 className="text-text-main text-lg font-bold leading-tight tracking-tight">FinControl</h1>
                    <p className="text-primary text-xs font-medium">Gestión Personal</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-muted hover:text-text-main hover:bg-slate-50'
                                }`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={isActive && item.filled ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {item.icon}
                            </span>
                            <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-card-border flex flex-col gap-4">
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-text-main hover:bg-slate-50 transition-colors"
                >
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-sm font-medium">Ajustes</span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-green-200"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

const Header = ({ title, subtitle }) => {
    const { user } = useAuth();

    return (
        <header className="h-16 border-b border-card-border bg-bg-sidebar/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
            {/* Mobile menu button */}
            <div className="flex items-center gap-4 md:hidden">
                <button className="text-text-main">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <span className="text-text-main font-bold text-lg">{title}</span>
            </div>

            {/* Desktop title */}
            <div className="hidden md:flex flex-col">
                <h2 className="text-text-main text-lg font-bold leading-tight">{title}</h2>
                {subtitle && <p className="text-text-muted text-xs">{subtitle}</p>}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex h-9 bg-slate-50 border border-card-border rounded-lg items-center px-3 w-64 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                    <span className="material-symbols-outlined text-text-muted text-[20px]">search</span>
                    <input
                        className="bg-transparent border-none text-sm text-text-main placeholder-text-muted focus:ring-0 w-full h-full p-0 pl-2"
                        placeholder="Buscar transacciones..."
                        type="text"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-text-muted hover:text-text-main transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-white"></span>
                </button>

                {/* Settings */}
                <Link
                    to="/settings"
                    className="p-2 text-text-muted hover:text-text-main transition-colors"
                    title="Configuración del Perfil"
                >
                    <span className="material-symbols-outlined">settings</span>
                </Link>

                <div className="h-8 w-px bg-card-border mx-1"></div>

                {/* User avatar */}
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-white text-sm font-bold border border-slate-200">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </button>
            </div>
        </header>
    );
};

const Layout = ({ children, title = 'Panel', subtitle }) => {
    const { user } = useAuth();
    const displaySubtitle = subtitle || `Bienvenido de nuevo, ${user?.name?.split(' ')[0] || 'Usuario'}`;

    return (
        <div className="bg-bg-body font-display text-text-main antialiased selection:bg-primary selection:text-white h-screen overflow-hidden flex">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 bg-bg-body relative">
                <Header title={title} subtitle={displaySubtitle} />
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
