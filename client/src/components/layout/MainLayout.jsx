import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Tag, PiggyBank, Target, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { texts } from '../../i18n/es';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const MainLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: texts.nav.dashboard, to: '/' },
        { icon: CreditCard, label: texts.nav.transactions, to: '/transactions' },
        { icon: Tag, label: texts.nav.tags, to: '/tags' },
        { icon: PiggyBank, label: texts.nav.budget, to: '/budget' },
        { icon: Target, label: texts.nav.goals, to: '/goals' },
    ];

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
            {/* Desktop Sidebar */}
            <Sidebar navItems={navItems} />

            {/* Mobile Bottom Nav */}
            <BottomNav navItems={navItems} />

            {/* Main Content Area */}
            <main className="md:pl-64 min-h-screen flex flex-col pb-20 md:pb-0">
                {/* Mobile Header (Simple) */}
                <header className="md:hidden h-16 flex items-center justify-between px-4 sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-[#ffffff10]">
                    <span className="font-bold text-lg">{texts.app.name}</span>
                    <button onClick={logout} className="p-2 text-textSecondary">
                        <LogOut size={20} />
                    </button>
                </header>

                {/* Desktop Header (Profile & Utils) */}
                <header className="hidden md:flex h-20 items-center justify-end px-8 sticky top-0 bg-background/90 backdrop-blur-md z-40">
                    <div className="flex items-center gap-4">
                        <span className="text-textSecondary text-sm">
                            {texts.app.welcome}, <span className="text-text font-semibold">{user?.firstName}</span>
                        </span>
                        <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-[#ffffff10]">
                            <User size={20} className="text-primary" />
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 hover:bg-surface rounded-full transition-colors text-textSecondary hover:text-red-400"
                            title={texts.app.logout}
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fadeIn">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
