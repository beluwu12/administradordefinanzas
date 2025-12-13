import React, { useState } from 'react';
import { LayoutDashboard, CreditCard, Tag, Settings, Menu, X, PiggyBank } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${active
            ? 'bg-primary/10 text-primary'
            : 'text-muted hover:bg-surface hover:text-text'
            }`}
    >
        <Icon size={20} className={active ? 'text-primary' : 'group-hover:text-text'} />
        <span className="font-medium">{label}</span>
    </Link>
);

export default function DashboardLayout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
        { icon: CreditCard, label: 'Transacciones', to: '/transactions' },
        { icon: Tag, label: 'Categorías', to: '/tags' },
        { icon: PiggyBank, label: 'Fijos y Ahorro', to: '/budget' },
    ];

    return (
        <div className="min-h-screen bg-background text-text flex">
            {/* Mobile Menu Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-[#ffffff10]
        transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="h-14 flex items-center px-4 mb-2 pt-4">
                    <div className="flex items-center gap-2 px-2 py-2 w-full rounded-md hover:bg-surface transition-colors cursor-pointer">
                        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white">
                            <span className="font-bold">M</span>
                        </div>
                        <span className="font-medium text-text">MyFinance</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="ml-auto lg:hidden text-muted"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="px-3 space-y-1 mt-4">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.to}
                            {...item}
                            active={location.pathname === item.to}
                        />
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-border flex items-center px-4 lg:px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="mr-4 lg:hidden text-muted"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="ml-auto flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                            JM
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
