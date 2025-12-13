import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CreditCard, Tag, PiggyBank, Target, LogOut, User } from 'lucide-react';
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

const MainLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [toast, setToast] = useState(null);

    const navItems = [
        { icon: LayoutDashboard, label: texts.nav.dashboard, to: '/' },
        { icon: CreditCard, label: texts.nav.transactions, to: '/transactions' },
        { icon: Tag, label: texts.nav.tags, to: '/tags' },
        { icon: PiggyBank, label: texts.nav.budget, to: '/budget' },
        { icon: Target, label: texts.nav.goals, to: '/goals' },
    ];

    useEffect(() => {
        // Register Push Subscription
        const registerPush = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });

                    // Send to backend
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

    // Expose Toast globally via window event (hacky but simple for this requirement)
    // Ideally use Context, but staying simple as per "MANTÉN responsive y no rompas"
    useEffect(() => {
        const handleToast = (e) => setToast(e.detail);
        window.addEventListener('show-toast', handleToast);
        return () => window.removeEventListener('show-toast', handleToast);
    }, []);

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Desktop Sidebar */}
            <Sidebar navItems={navItems} />

            {/* Mobile Bottom Nav */}
            <BottomNav navItems={navItems} />

            {/* Mobile FAB */}
            <FloatingActionButton />

            {/* Main Content Area */}
            <main className="md:pl-64 min-h-screen flex flex-col pb-20 md:pb-0">
                {/* Mobile Header (Simple) */}
                <header className="md:hidden h-16 flex items-center justify-between px-4 sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-[#ffffff10]">
                    <span className="font-bold text-lg">{texts.app.name}</span>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <button onClick={logout} className="p-2 text-textSecondary">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Desktop Header (Profile & Utils) */}
                <header className="hidden md:flex h-20 items-center justify-end px-8 sticky top-0 bg-background/90 backdrop-blur-md z-40">
                    <div className="flex items-center gap-4">
                        <NotificationBell />
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
