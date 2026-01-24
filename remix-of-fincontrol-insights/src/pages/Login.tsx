/**
 * Login Page - Enhanced Visual Design
 * Features: Responsive layout, animations, language toggle
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Wallet, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading, error } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { toast } = useToast();

    // Email/password state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const from = location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(email, password);
            toast({
                title: language === 'es' ? '¡Bienvenido!' : 'Welcome!',
                description: language === 'es' ? 'Inicio de sesión exitoso' : 'Login successful'
            });
        } catch {
            toast({
                title: 'Error',
                description: error || (language === 'es' ? 'Credenciales inválidas' : 'Invalid credentials'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Illustration (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZWMGg2djMwem0tNiAwSDI0VjBoNnYzMHptLTYgMEgxOFYwaDZ2MzB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
                    <div className="mb-8 animate-float">
                        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Wallet className="w-16 h-16" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-center">Tu Gestor</h1>
                    <p className="text-lg text-white/80 text-center max-w-md">
                        {language === 'es'
                            ? 'Toma el control de tus finanzas personales de manera simple y efectiva'
                            : 'Take control of your personal finances simply and effectively'}
                    </p>
                    <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                        <div className="p-4">
                            <div className="text-3xl font-bold">💰</div>
                            <div className="text-sm mt-2 text-white/70">
                                {language === 'es' ? 'Transacciones' : 'Transactions'}
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="text-3xl font-bold">📊</div>
                            <div className="text-sm mt-2 text-white/70">
                                {language === 'es' ? 'Reportes' : 'Reports'}
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="text-3xl font-bold">🎯</div>
                            <div className="text-sm mt-2 text-white/70">
                                {language === 'es' ? 'Metas' : 'Goals'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-8">
                {/* Language Toggle */}
                <div className="absolute top-4 right-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <Globe className="h-4 w-4" />
                                {language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLanguage('es')}>
                                🇪🇸 Español
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('en')}>
                                🇺🇸 English
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2">
                        {/* Mobile logo */}
                        <div className="lg:hidden mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <Wallet className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'es'
                                ? 'Ingresa a tu cuenta para continuar'
                                : 'Enter your account to continue'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    {language === 'es' ? 'Correo Electrónico' : 'Email'}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {language === 'es' ? 'Contraseña' : 'Password'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-medium transition-all duration-200 active:scale-[0.98]"
                                disabled={isLoading || isSubmitting}
                            >
                                {(isLoading || isSubmitting) ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center pt-2">
                        <p className="text-sm text-muted-foreground">
                            {language === 'es' ? '¿No tienes cuenta?' : "Don't have an account?"}{' '}
                            <Link to="/register" className="text-primary font-medium hover:underline">
                                {language === 'es' ? 'Crear Cuenta' : 'Create Account'}
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>

            {/* CSS for float animation */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Login;
