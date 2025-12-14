import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserPlus, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { texts } from '../i18n/es';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
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
            // api.js interceptor unwraps successful responses, so res.data IS the data object
            const data = res.data;
            if (data && data.token) {
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-surface p-8 rounded-3xl shadow-2xl border border-border w-full max-w-md animate-slideUp">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-text">Crear Cuenta</h1>
                    <p className="text-muted text-sm mt-2">Únete para gestionar tus finanzas</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-textSecondary ml-1">Nombre</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-muted" size={20} />
                                <input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Juan"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-textSecondary ml-1">Apellido</label>
                            <div className="relative">
                                <input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Pérez"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textSecondary ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-muted" size={20} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text focus:outline-none focus:border-primary transition-colors"
                                placeholder="ejemplo@correo.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textSecondary ml-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-muted" size={20} />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text focus:outline-none focus:border-primary transition-colors"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creando...' : 'Crear Cuenta'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-muted text-sm">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-primary font-bold hover:underline">
                            Inicia Sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
