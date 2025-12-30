import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api, { unwrapData } from '../api';
import { getCountryOptions } from '../config/countries';

/**
 * RegisterPage - Based on appuidesktop/register_page template
 * Split layout with form and decorative panel
 */
export default function RegisterPage() {
    const countryOptions = getCountryOptions();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        country: 'VE'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/register', formData);
            const data = unwrapData(res);
            if (data && data.token) {
                // refreshToken is now handled via httpOnly cookie - not passed here
                login(data, data.token);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background min-h-screen flex">
            {/* Left Panel - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-32 relative overflow-y-auto">
                {/* Logo */}
                <div className="flex items-center gap-4 text-foreground mb-10">
                    <div className="size-8 text-primary">
                        <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">Gestor Financiero</h2>
                </div>

                {/* Heading */}
                <div className="mb-10">
                    <h1 className="text-foreground text-4xl font-black leading-tight tracking-[-0.033em] mb-2">
                        Comienza tu viaje financiero
                    </h1>
                    <p className="text-gray-500 text-base font-normal leading-normal">
                        Únete a miles que administran su dinero de forma inteligente.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-lg">
                    {/* Name Fields */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex flex-col flex-1">
                            <p className="text-foreground text-base font-medium leading-normal pb-2">Nombre</p>
                            <input
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full rounded-lg text-foreground focus:outline-0 focus:ring-1 focus:ring-primary border border-gray-200 bg-background focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal transition-colors"
                                placeholder="María"
                                required
                            />
                        </label>
                        <label className="flex flex-col flex-1">
                            <p className="text-foreground text-base font-medium leading-normal pb-2">Apellido</p>
                            <input
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full rounded-lg text-foreground focus:outline-0 focus:ring-1 focus:ring-primary border border-gray-200 bg-background focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal transition-colors"
                                placeholder="García"
                                required
                            />
                        </label>
                    </div>

                    {/* Email */}
                    <label className="flex flex-col w-full">
                        <p className="text-foreground text-base font-medium leading-normal pb-2">Correo Electrónico</p>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg text-foreground focus:outline-0 focus:ring-1 focus:ring-primary border border-gray-200 bg-background focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal transition-colors"
                            placeholder="maria@ejemplo.com"
                            required
                        />
                    </label>

                    {/* Country */}
                    <label className="flex flex-col w-full">
                        <p className="text-foreground text-base font-medium leading-normal pb-2">País</p>
                        <div className="relative">
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full rounded-lg text-foreground focus:outline-0 focus:ring-1 focus:ring-primary border border-gray-200 bg-background focus:border-primary h-14 p-[15px] pr-10 text-base font-normal leading-normal appearance-none transition-colors cursor-pointer"
                                required
                            >
                                {countryOptions.map(({ value, label }) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </label>

                    {/* Password */}
                    <label className="flex flex-col w-full">
                        <p className="text-foreground text-base font-medium leading-normal pb-2">Contraseña</p>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full rounded-lg text-foreground focus:outline-0 focus:ring-1 focus:ring-primary border border-gray-200 bg-background focus:border-primary h-14 placeholder:text-gray-400 p-[15px] pr-12 text-base font-normal leading-normal transition-colors"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-foreground transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary hover:bg-pink-700 active:scale-[0.98] text-white text-base font-bold leading-normal transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                Creando cuenta...
                            </>
                        ) : (
                            'Crear Cuenta'
                        )}
                    </button>

                    {/* Terms */}
                    <p className="text-center text-gray-500 text-sm">
                        Al registrarte, aceptas nuestros{' '}
                        <a className="underline hover:text-foreground" href="#">Términos</a> y{' '}
                        <a className="underline hover:text-foreground" href="#">Política de Privacidad</a>.
                    </p>

                    {/* Divider */}
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">O continúa con</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-transparent h-12 hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-serif text-xl">G</span>
                            <span className="text-foreground text-sm font-medium">Google</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-transparent h-12 hover:bg-gray-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-foreground">phone_iphone</span>
                            <span className="text-foreground text-sm font-medium">Apple</span>
                        </button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-foreground text-sm font-medium mt-2">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="text-primary hover:underline font-bold">
                            Inicia sesión
                        </Link>
                    </p>
                </form>
            </div>

            {/* Right Panel - Decorative */}
            <div className="hidden lg:flex w-1/2 bg-background relative items-center justify-center overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl"></div>
                <div className="relative z-10 max-w-lg p-10 text-center">
                    {/* Chart Decoration */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 mb-8 bg-white">
                        <div className="absolute inset-0 flex items-end justify-center px-12 pb-0 gap-4 bg-gradient-to-b from-transparent to-primary/5">
                            <div className="w-12 h-[40%] bg-primary/30 rounded-t-lg"></div>
                            <div className="w-12 h-[65%] bg-primary/50 rounded-t-lg"></div>
                            <div className="w-12 h-[50%] bg-primary/40 rounded-t-lg"></div>
                            <div className="w-12 h-[85%] bg-primary rounded-t-lg shadow-[0_0_20px_rgba(219,15,121,0.4)]"></div>
                            <div className="w-12 h-[60%] bg-primary/40 rounded-t-lg"></div>
                        </div>
                        {/* Floating Card */}
                        <div
                            className="absolute top-8 right-8 bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex items-center gap-3 animate-bounce"
                            style={{ animationDuration: '3s' }}
                        >
                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">trending_up</span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Ahorros Totales</p>
                                <p className="text-sm font-bold text-foreground">+$1,240.50</p>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-foreground mb-4">Controla tu patrimonio</h3>
                    <p className="text-lg text-gray-500">
                        Obtén información en tiempo real sobre tus hábitos de gasto y observa cómo crecen tus ahorros.
                    </p>
                </div>
            </div>
        </div>
    );
}
