import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCountryConfig, isDualCurrency } from '../config/countries';
import api, { unwrapData } from '../api';

export default function SettingsPage() {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const countryConfig = getCountryConfig(user?.country || 'VE');
    const isDual = isDualCurrency(user?.country || 'VE');

    const [activeSection, setActiveSection] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        timezone: user?.timezone || 'America/Caracas'
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Delete account state
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Notification preferences (stored in localStorage for now)
    const [notifications, setNotifications] = useState({
        push: localStorage.getItem('notif_push') !== 'false',
        fixedExpenses: localStorage.getItem('notif_fixed') !== 'false',
        goals: localStorage.getItem('notif_goals') !== 'false'
    });

    const sections = [
        { id: 'profile', icon: 'person', label: 'Perfil' },
        { id: 'preferences', icon: 'tune', label: 'Preferencias' },
        { id: 'notifications', icon: 'notifications', label: 'Notificaciones' },
        { id: 'security', icon: 'lock', label: 'Seguridad' },
        { id: 'about', icon: 'info', label: 'Acerca de' },
    ];

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    // ═══════════════════════════════════════════════════════════════
    // PROFILE HANDLERS
    // ═══════════════════════════════════════════════════════════════
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/auth/profile', profileForm);
            const userData = unwrapData(response);
            // Update local user state - token stays the same, refreshToken is in httpOnly cookie
            const token = localStorage.getItem('finance_token');
            login(userData, token);
            showMessage('Perfil actualizado exitosamente');
        } catch (error) {
            showMessage(error.response?.data?.error || 'Error actualizando perfil', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // PASSWORD HANDLERS
    // ═══════════════════════════════════════════════════════════════
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showMessage('Contraseña actualizada exitosamente');
        } catch (error) {
            showMessage(error.response?.data?.error || 'Error cambiando contraseña', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // DELETE ACCOUNT HANDLERS
    // ═══════════════════════════════════════════════════════════════
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showMessage('Ingresa tu contraseña para confirmar', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.delete('/auth/account', { data: { password: deletePassword } });
            logout();
            navigate('/login');
        } catch (error) {
            showMessage(error.response?.data?.error || 'Error eliminando cuenta', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATION HANDLERS
    // ═══════════════════════════════════════════════════════════════
    const toggleNotification = (key) => {
        const newValue = !notifications[key];
        setNotifications(prev => ({ ...prev, [key]: newValue }));
        localStorage.setItem(`notif_${key}`, newValue.toString());
        showMessage(`Notificaciones ${newValue ? 'activadas' : 'desactivadas'}`);
    };

    return (
        <div className="space-y-6">
            {/* Message Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-medium animate-in slide-in-from-right ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-200 pb-6">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                    Configuración
                </h1>
                <p className="text-gray-500 text-base font-normal">
                    Personaliza tu experiencia y gestiona tu cuenta.
                </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar - Navigation */}
                <div className="lg:col-span-3">
                    <nav className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeSection === section.id
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                                <span className="text-sm">{section.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="text-sm">Cerrar Sesión</span>
                    </button>
                </div>

                {/* Right Content Area */}
                <div className="lg:col-span-9">
                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* PROFILE SECTION */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    {activeSection === 'profile' && (
                        <form onSubmit={handleProfileUpdate} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                <span className="material-symbols-outlined text-primary">person</span>
                                <h2 className="text-xl font-bold text-gray-900">Información del Perfil</h2>
                            </div>

                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-pink-700 flex items-center justify-center text-white text-2xl font-bold">
                                    {profileForm.firstName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {profileForm.firstName} {profileForm.lastName}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{user?.email}</p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={profileForm.firstName}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        value={profileForm.lastName}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email}
                                        className="w-full rounded-xl border-gray-300 bg-gray-50 cursor-not-allowed"
                                        disabled
                                    />
                                    <p className="text-xs text-gray-400 mt-1">El correo no puede ser modificado</p>
                                </div>
                            </div>

                            {/* Country & Currency Card */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-3">Región y Moneda</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">País</p>
                                        <p className="text-gray-900 font-bold">{countryConfig.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Moneda Principal</p>
                                        <p className="text-gray-900 font-bold">{countryConfig.defaultCurrency}</p>
                                    </div>
                                    {isDual && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-400 uppercase">Moneda Secundaria</p>
                                            <p className="text-gray-900 font-bold">VES (Bolívares)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    )}

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* PREFERENCES SECTION */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    {activeSection === 'preferences' && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                <span className="material-symbols-outlined text-primary">tune</span>
                                <h2 className="text-xl font-bold text-gray-900">Preferencias</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Theme Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-600">dark_mode</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Tema Oscuro</p>
                                            <p className="text-xs text-gray-500">Próximamente disponible</p>
                                        </div>
                                    </div>
                                    <div className="w-12 h-6 bg-gray-300 rounded-full opacity-50 cursor-not-allowed"></div>
                                </div>

                                {/* Language */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-600">language</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Idioma</p>
                                            <p className="text-xs text-gray-500">Español (predeterminado)</p>
                                        </div>
                                    </div>
                                    <span className="text-primary font-bold text-sm">ES</span>
                                </div>

                                {/* Timezone */}
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="material-symbols-outlined text-gray-600">schedule</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Zona Horaria</p>
                                        </div>
                                    </div>
                                    <select
                                        value={profileForm.timezone}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                    >
                                        <option value="America/Caracas">América/Caracas (VE)</option>
                                        <option value="America/Bogota">América/Bogotá (CO)</option>
                                        <option value="America/Santiago">América/Santiago (CL)</option>
                                        <option value="America/Mexico_City">América/Ciudad de México (MX)</option>
                                        <option value="America/Argentina/Buenos_Aires">América/Buenos Aires (AR)</option>
                                        <option value="America/New_York">América/Nueva York (US)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* NOTIFICATIONS SECTION */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    {activeSection === 'notifications' && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                <span className="material-symbols-outlined text-primary">notifications</span>
                                <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Push Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-600">notifications_active</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Notificaciones Push</p>
                                            <p className="text-xs text-gray-500">Recibe alertas en tu dispositivo</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('push')}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${notifications.push ? 'bg-primary' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications.push ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                {/* Fixed Expenses Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-600">event</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Recordatorios de Gastos Fijos</p>
                                            <p className="text-xs text-gray-500">5, 3 y 1 día antes del vencimiento</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('fixedExpenses')}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${notifications.fixedExpenses ? 'bg-primary' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications.fixedExpenses ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                {/* Goals Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-600">savings</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Recordatorios de Metas</p>
                                            <p className="text-xs text-gray-500">Recibe alertas de quincena</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('goals')}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${notifications.goals ? 'bg-primary' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications.goals ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECURITY SECTION */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    {activeSection === 'security' && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                <span className="material-symbols-outlined text-primary">lock</span>
                                <h2 className="text-xl font-bold text-gray-900">Seguridad</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Change Password */}
                                <form onSubmit={handlePasswordChange} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="material-symbols-outlined text-gray-600">key</span>
                                        <p className="font-medium text-gray-900">Cambiar Contraseña</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña Actual</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                    </button>
                                </form>

                                {/* Delete Account */}
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="material-symbols-outlined text-red-600">delete_forever</span>
                                        <div>
                                            <p className="font-medium text-red-900">Eliminar Cuenta</p>
                                            <p className="text-xs text-red-600">Esta acción es irreversible. Se eliminarán todos tus datos.</p>
                                        </div>
                                    </div>

                                    {!showDeleteConfirm ? (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                                        >
                                            Eliminar mi Cuenta
                                        </button>
                                    ) : (
                                        <div className="space-y-3 mt-4 p-4 bg-white rounded-xl border border-red-200">
                                            <p className="text-sm text-red-700 font-medium">Ingresa tu contraseña para confirmar:</p>
                                            <input
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                className="w-full rounded-xl border-red-300 focus:border-red-500 focus:ring-red-500"
                                                placeholder="Tu contraseña"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false);
                                                        setDeletePassword('');
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* ABOUT SECTION */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    {activeSection === 'about' && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                <span className="material-symbols-outlined text-primary">info</span>
                                <h2 className="text-xl font-bold text-gray-900">Acerca de</h2>
                            </div>

                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-pink-700 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-3xl">account_balance_wallet</span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-1">Gestor Financiero</h3>
                                <p className="text-gray-500 text-sm mb-4">Versión 1.0.0</p>
                                <p className="text-gray-600 text-sm max-w-md mx-auto">
                                    Aplicación de finanzas personales con soporte multi-moneda,
                                    metas de ahorro y control de gastos fijos.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center pt-4 border-t border-gray-100">
                                <div>
                                    <p className="text-2xl font-black text-primary">{countryConfig.currencies?.length || 1}</p>
                                    <p className="text-xs text-gray-500 uppercase">Monedas</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-primary">∞</p>
                                    <p className="text-xs text-gray-500 uppercase">Transacciones</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400">
                                    Desarrollado con ❤️ para ayudarte a alcanzar tus metas financieras
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
