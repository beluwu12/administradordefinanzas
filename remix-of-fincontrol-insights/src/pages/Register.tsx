/**
 * Register Page - Enhanced Visual Design
 * Features: Country selector, dual currency toggle, language toggle, responsive
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Wallet, UserPlus, Globe, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getCountryOptions, canEnableDualCurrency, getCountryConfig } from '@/config/countries';

const Register = () => {
    const navigate = useNavigate();
    const { register, isLoading, error, isAuthenticated } = useAuth();
    const { language, setLanguage } = useLanguage();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: 'VE',
        dualCurrencyEnabled: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const countryOptions = getCountryOptions();
    const showDualCurrencyToggle = canEnableDualCurrency(formData.country);
    const countryConfig = getCountryConfig(formData.country);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Update dual currency when country changes
    useEffect(() => {
        if (formData.country === 'VE') {
            setFormData(prev => ({ ...prev, dualCurrencyEnabled: true }));
        } else if (!canEnableDualCurrency(formData.country)) {
            setFormData(prev => ({ ...prev, dualCurrencyEnabled: false }));
        }
    }, [formData.country]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: 'Error',
                description: language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match',
                variant: 'destructive'
            });
            return;
        }

        if (formData.password.length < 6) {
            toast({
                title: 'Error',
                description: language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                country: formData.country,
                dualCurrencyEnabled: showDualCurrencyToggle ? formData.dualCurrencyEnabled : false,
                language: language,
            });
            toast({
                title: language === 'es' ? '¡Cuenta creada!' : 'Account created!',
                description: language === 'es' ? 'Bienvenido a Tu Gestor' : 'Welcome to Tu Gestor'
            });
            navigate('/');
        } catch {
            toast({
                title: 'Error',
                description: error || (language === 'es' ? 'No se pudo crear la cuenta' : 'Could not create account'),
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
                            <UserPlus className="w-16 h-16" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-center">
                        {language === 'es' ? 'Únete a Tu Gestor' : 'Join Tu Gestor'}
                    </h1>
                    <p className="text-lg text-white/80 text-center max-w-md">
                        {language === 'es'
                            ? 'Crea tu cuenta gratuita y comienza a administrar tus finanzas personales'
                            : 'Create your free account and start managing your personal finances'}
                    </p>
                    <div className="mt-12 space-y-4 text-center">
                        <div className="flex items-center gap-3 text-white/80">
                            <span className="text-2xl">✓</span>
                            <span>{language === 'es' ? 'Multi-moneda' : 'Multi-currency'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                            <span className="text-2xl">✓</span>
                            <span>{language === 'es' ? 'Reportes detallados' : 'Detailed reports'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                            <span className="text-2xl">✓</span>
                            <span>{language === 'es' ? 'Metas de ahorro' : 'Savings goals'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-8 overflow-y-auto">
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

                <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm my-8">
                    <CardHeader className="text-center pb-2">
                        {/* Mobile logo */}
                        <div className="lg:hidden mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <Wallet className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {language === 'es' ? 'Crear Cuenta' : 'Create Account'}
                        </CardTitle>
                        <CardDescription>
                            {language === 'es' ? 'Únete a Tu Gestor' : 'Join Tu Gestor'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">
                                        {language === 'es' ? 'Nombre' : 'First Name'}
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        placeholder={language === 'es' ? 'Juan' : 'John'}
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        autoComplete="given-name"
                                        className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">
                                        {language === 'es' ? 'Apellido' : 'Last Name'}
                                    </Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        placeholder={language === 'es' ? 'Pérez' : 'Doe'}
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        autoComplete="family-name"
                                        className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    {language === 'es' ? 'Correo Electrónico' : 'Email'}
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                    className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Country Selector */}
                            <div className="space-y-2">
                                <Label>{language === 'es' ? 'País' : 'Country'}</Label>
                                <Select
                                    value={formData.country}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue>
                                            {countryConfig.flag} {countryConfig.name}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countryOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dual Currency Toggle */}
                            {showDualCurrencyToggle && (
                                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium flex items-center gap-2">
                                                💱 {language === 'es' ? 'Moneda dual' : 'Dual currency'}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                USD + VES
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.dualCurrencyEnabled}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({ ...prev, dualCurrencyEnabled: checked }))
                                            }
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formData.dualCurrencyEnabled
                                            ? (language === 'es'
                                                ? 'Podrás registrar gastos en dólares y bolívares'
                                                : 'You can record expenses in dollars and bolivars')
                                            : (language === 'es'
                                                ? 'Solo usarás dólares (puedes activar después)'
                                                : 'You will only use dollars (can enable later)')
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {language === 'es' ? 'Contraseña' : 'Password'}
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                    className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    {language === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                    className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-medium transition-all duration-200 active:scale-[0.98]"
                                disabled={isLoading || isSubmitting}
                            >
                                {(isLoading || isSubmitting) ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                )}
                                {language === 'es' ? 'Crear Cuenta' : 'Create Account'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center pt-2">
                        <p className="text-sm text-muted-foreground">
                            {language === 'es' ? '¿Ya tienes cuenta?' : 'Already have an account?'}{' '}
                            <Link to="/login" className="text-primary font-medium hover:underline">
                                {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
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

export default Register;
