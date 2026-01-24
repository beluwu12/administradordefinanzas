import { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Moon,
  Sun,
  ChevronRight,
  BellRing,
  AlertTriangle,
  Calendar,
  Target,
  FileText,
  Volume2,
  VolumeX,
  Loader2,
  DollarSign
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { canEnableDualCurrency } from '@/config/countries';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, currencies } = useCurrency();
  const { settings, updateSettings, requestPushPermission, playNotificationSound } = useNotificationSettings();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user, updateUser } = useAuth();

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({ firstName: '', lastName: '', email: '' });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dualCurrencyEnabled, setDualCurrencyEnabled] = useState(user?.dualCurrencyEnabled ?? true);

  const showDualCurrencyToggle = user?.country ? canEnableDualCurrency(user.country) : false;

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authApi.getProfile();
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handleEnablePush = async () => {
    const permission = await requestPushPermission();
    if (permission === 'granted') {
      toast({
        title: t('notifications.pushEnabled'),
        description: t('notifications.pushEnabledDesc'),
      });
    } else if (permission === 'denied') {
      toast({
        title: t('notifications.permissionDenied'),
        description: t('notifications.permissionDeniedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      toast({
        title: t('common.success'),
        description: t('settings.saved'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.saveFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionBadge = () => {
    switch (settings.pushPermission) {
      case 'granted':
        return <Badge variant="default" className="bg-[hsl(142,76%,36%)]">{t('settings.enabled')}</Badge>;
      case 'denied':
        return <Badge variant="destructive">{t('settings.blocked')}</Badge>;
      default:
        return <Badge variant="secondary">{t('settings.notSet')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('settings.profile')}
          </CardTitle>
          <CardDescription>{t('settings.profileDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingProfile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-9 w-24" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full sm:col-span-2" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('settings.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('settings.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('settings.appearance')}
          </CardTitle>
          <CardDescription>{t('settings.customizeLook')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.theme')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.selectTheme')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-2 h-4 w-4" />
                {t('settings.light')}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-2 h-4 w-4" />
                {t('settings.dark')}
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                {t('settings.system')}
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="currency">{t('settings.currency')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.setCurrency')}</p>
            </div>
            <Select value={currency} onValueChange={(val) => setCurrency(val as keyof typeof currencies)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currencies).map(([code, info]) => (
                  <SelectItem key={code} value={code}>
                    {info.code} ({info.symbol}) - {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.setLanguage')}</p>
            </div>
            <Select
              value={(() => {
                try {
                  return localStorage.getItem('app-language') || 'en';
                } catch { return 'en'; }
              })()}
              onValueChange={(val) => {
                localStorage.setItem('app-language', val);
                window.location.reload();
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dual Currency Toggle - Only show for countries that support it */}
          {showDualCurrencyToggle && (
            <>
              <Separator />
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">
                        {language === 'es' ? 'Moneda Dual' : 'Dual Currency'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        USD + VES
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={dualCurrencyEnabled}
                    onCheckedChange={async (checked) => {
                      setDualCurrencyEnabled(checked);
                      try {
                        await authApi.updatePreferences({ dualCurrencyEnabled: checked } as any);
                        updateUser({ dualCurrencyEnabled: checked });
                        toast({
                          title: t('common.success'),
                          description: language === 'es'
                            ? (checked ? 'Moneda dual activada' : 'Moneda dual desactivada')
                            : (checked ? 'Dual currency enabled' : 'Dual currency disabled'),
                        });
                      } catch (error) {
                        setDualCurrencyEnabled(!checked);
                        toast({
                          title: t('common.error'),
                          description: t('settings.saveFailed'),
                          variant: 'destructive',
                        });
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {dualCurrencyEnabled
                    ? (language === 'es'
                      ? 'Puedes registrar transacciones en USD y VES'
                      : 'You can record transactions in USD and VES')
                    : (language === 'es'
                      ? 'Solo se mostrará USD'
                      : 'Only USD will be shown')
                  }
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('settings.notifications')}
          </CardTitle>
          <CardDescription>{t('settings.configureNotifications')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Push Notifications Master Toggle */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-primary" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">{t('settings.pushNotifications')}</Label>
                    {getPermissionBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.pushDescription')}
                  </p>
                </div>
              </div>
              {settings.pushPermission === 'granted' ? (
                <Switch
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => updateSettings({ pushEnabled: checked })}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnablePush}
                  disabled={settings.pushPermission === 'denied'}
                >
                  {settings.pushPermission === 'denied' ? t('settings.blocked') : t('settings.enable')}
                </Button>
              )}
            </div>
            {settings.pushPermission === 'denied' && (
              <p className="text-xs text-destructive">
                {language === 'es'
                  ? 'Las notificaciones están bloqueadas. Habilítalas en la configuración de tu navegador y actualiza la página.'
                  : 'Notifications are blocked. Please enable them in your browser settings and refresh the page.'}
              </p>
            )}
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.emailNotifications')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.emailDescription')}</p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => updateSettings({ emailEnabled: checked })}
            />
          </div>

          <Separator />

          {/* Sound Settings */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-primary" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('settings.soundSettings')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.soundDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>
            {settings.soundEnabled && (
              <div className="pl-8 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('settings.volume')}</Label>
                    <span className="text-sm font-medium">{settings.soundVolume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[settings.soundVolume]}
                      onValueChange={([value]) => updateSettings({ soundVolume: value })}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playNotificationSound('info')}
                  >
                    {t('settings.testInfo')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playNotificationSound('warning')}
                  >
                    {t('settings.testWarning')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playNotificationSound('success')}
                  >
                    {t('settings.testSuccess')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Alert Types */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{t('settings.alertTypes')}</h4>

            {/* Budget Alerts */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-[hsl(43,74%,56%)]" />
                  <div className="space-y-0.5">
                    <Label>{t('settings.budgetAlerts')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.budgetAlertsDescription')}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.budgetAlerts}
                  onCheckedChange={(checked) => updateSettings({ budgetAlerts: checked })}
                />
              </div>
              {settings.budgetAlerts && (
                <div className="pl-7 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t('settings.alertThreshold')}</Label>
                      <span className="text-sm font-medium">{settings.budgetThreshold}%</span>
                    </div>
                    <Slider
                      value={[settings.budgetThreshold]}
                      onValueChange={([value]) => updateSettings({ budgetThreshold: value })}
                      min={50}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('settings.alertWhenSpending', { threshold: settings.budgetThreshold })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bill Reminders */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div className="space-y-0.5">
                    <Label>{t('settings.billReminders')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.billRemindersDescription')}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.billReminders}
                  onCheckedChange={(checked) => updateSettings({ billReminders: checked })}
                />
              </div>
              {settings.billReminders && (
                <div className="pl-7 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t('settings.remindMe')}</Label>
                      <span className="text-sm font-medium">{settings.billReminderDays} {t('settings.daysBefore')}</span>
                    </div>
                    <Slider
                      value={[settings.billReminderDays]}
                      onValueChange={([value]) => updateSettings({ billReminderDays: value })}
                      min={1}
                      max={14}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Goal Updates */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-[hsl(142,76%,36%)]" />
                <div className="space-y-0.5">
                  <Label>{t('settings.goalUpdates')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.goalUpdatesDescription')}</p>
                </div>
              </div>
              <Switch
                checked={settings.goalUpdates}
                onCheckedChange={(checked) => updateSettings({ goalUpdates: checked })}
              />
            </div>

            {/* Weekly Report */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-[hsl(200,70%,50%)]" />
                <div className="space-y-0.5">
                  <Label>{t('settings.weeklyReport')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.weeklyReportDescription')}</p>
                </div>
              </div>
              <Switch
                checked={settings.weeklyReport}
                onCheckedChange={(checked) => updateSettings({ weeklyReport: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.security')}
          </CardTitle>
          <CardDescription>{t('settings.securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-between">
            {t('settings.changePassword')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">{t('common.cancel')}</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;