import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { texts } from '../../i18n/es';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import FloatingActionButton from '../common/FloatingActionButton';
import NotificationBell from '../common/NotificationBell';
import Toast from '../common/Toast';
import api from '../../api';

const VAPID_PUBLIC_KEY = 'BLoPBpUNLW3wbd5GrQbeqpPDyrDVCF0lN-0p-KfWiGwaRvbI6KOVcXGbDh7aCxlUbX9c1eJQPP-m0Ycr_-uJmFs';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * MainLayout - Based on appuidesktop template
 * Light background, white cards, pink accent
 */
const MainLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [toast, setToast] = useState(null);

    const navItems = [
        { icon: 'dashboard', label: texts.nav.dashboard, to: '/' },
        { icon: 'receipt_long', label: texts.nav.transactions, to: '/transactions' },
        { icon: 'sell', label: texts.nav.tags, to: '/tags' },
        { icon: 'pie_chart', label: texts.nav.budget, to: '/budget' },
        { icon: 'savings', label: texts.nav.goals, to: '/goals' },
    ];

    useEffect(() => {
        const registerPush = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });

                    await api.post('/notifications/subscribe', {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
                            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
                        }
                    });
                } catch (error) {
                    console.log('Push subscription failed (or denied)', error);
                }
            }
        };

        if (user) {
            registerPush();
        }
    }, [user]);

    useEffect(() => {
        const handleToast = (e) => setToast(e.detail);
        window.addEventListener('show-toast', handleToast);
        return () => window.removeEventListener('show-toast', handleToast);
    }, []);

    return (
        <div className="bg-background min-h-screen overflow-hidden flex">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Desktop Sidebar */}
            <Sidebar navItems={navItems} />

            {/* Mobile Bottom Nav */}
            <BottomNav navItems={navItems} />

            {/* Mobile FAB */}
            <FloatingActionButton />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 md:ml-64">
                {/* Desktop Header */}
                <header className="hidden md:flex h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex flex-col">
                        <h2 className="text-foreground text-lg font-bold leading-tight">Resumen</h2>
                        <p className="text-gray-500 text-xs">Bienvenido de nuevo, {user?.firstName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="hidden lg:flex h-9 bg-gray-50 border border-gray-200 rounded-lg items-center px-3 w-64 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                            <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
                            <input
                                className="bg-transparent border-none text-sm text-foreground placeholder-gray-400 focus:ring-0 w-full h-full p-0 pl-2"
                                placeholder="Buscar transacciones..."
                                type="text"
                            />
                        </div>
                        <NotificationBell />
                        <Link className="p-2 text-gray-500 hover:text-foreground transition-colors" to="/settings" title="Configuración">
                            <span className="material-symbols-outlined">settings</span>
                        </Link>
                        <div className="h-8 w-px bg-gray-200 mx-1"></div>
                        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors">
                            <div
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-700 flex items-center justify-center text-white text-sm font-bold"
                            >
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                        </button>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-20 bg-background/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Bienvenido,</span>
                        <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground">{user?.firstName}</h2>
                    </div>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors text-foreground">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fadeIn">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
