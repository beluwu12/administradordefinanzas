import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api, { unwrapData } from '../api';

/**
 * LoginPage - Based on appuidesktop/login_page template
 * Gradient background, centered card, pink accent
 */
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });
            const data = unwrapData(res);
            if (data && data.token) {
                // refreshToken is now handled via httpOnly cookie - not passed here
                login(data, data.token);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background min-h-screen flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 px-6 lg:px-10 py-3 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4 text-foreground">
                    <div className="size-8 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                    </div>
                    <h2 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em]">Gestor Financiero</h2>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/register"
                        className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/10 hover:bg-primary/20 transition-colors text-foreground text-sm font-bold"
                    >
                        <span className="truncate">Registrarse</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative z-0">
                {/* Background Gradients */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl -z-10"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tl from-primary/10 to-transparent blur-3xl -z-10"></div>

                <div className="flex flex-col max-w-[480px] w-full flex-1">
                    {/* Heading */}
                    <div className="flex flex-col gap-2 pb-8 text-center">
                        <h1 className="text-foreground text-4xl font-black leading-tight tracking-[-0.033em]">
                            Bienvenido de Nuevo
                        </h1>
                        <p className="text-gray-500 text-base font-normal leading-normal">
                            Ingresa tus credenciales para acceder a tu panel financiero.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Email Field */}
                            <label className="flex flex-col w-full gap-2">
                                <p className="text-foreground text-base font-medium leading-normal">Correo Electrónico</p>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full resize-none overflow-hidden rounded-lg text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 bg-background focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal transition-all"
                                    placeholder="nombre@empresa.com"
                                    required
                                />
                            </label>

                            {/* Password Field */}
                            <label className="flex flex-col w-full gap-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-foreground text-base font-medium leading-normal">Contraseña</p>
                                </div>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full resize-none overflow-hidden rounded-lg text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 bg-background focus:border-primary h-14 placeholder:text-gray-400 p-[15px] pr-12 text-base font-normal leading-normal transition-all"
                                        placeholder="Ingresa tu contraseña"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors flex items-center justify-center p-1 rounded-full hover:bg-gray-100"
                                        aria-label="Alternar visibilidad de contraseña"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </label>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary hover:bg-pink-700 active:scale-[0.98] transition-all text-white text-base font-bold leading-normal flex gap-2 shadow-md shadow-primary/20 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                        <span>Entrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Iniciar Sesión</span>
                                        <span className="material-symbols-outlined text-[20px]">login</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-gray-500 font-medium">O continúa con</span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 border border-gray-200 bg-background hover:bg-gray-50 transition-colors text-foreground text-sm font-bold group">
                                <span className="font-serif text-xl group-hover:scale-110 transition-transform">G</span>
                                <span>Google</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 border border-gray-200 bg-background hover:bg-gray-50 transition-colors text-foreground text-sm font-bold group">
                                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">phone_iphone</span>
                                <span>Apple</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8">
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-4 text-center">
                            <p className="text-gray-500 text-sm">¿Aún no tienes una cuenta?</p>
                            <Link
                                to="/register"
                                className="text-sm font-bold leading-normal flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                            >
                                Crear una cuenta
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
