import { useState } from 'react';
import { Search, Menu, Command, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/features/ThemeToggle';
import NotificationsDropdown from '@/components/features/NotificationsDropdown';
import GlobalSearch from '@/components/features/GlobalSearch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Generate initials from user name
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Trigger */}
            <Button
              variant="outline"
              className="relative hidden h-9 w-64 justify-start text-sm text-muted-foreground sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>{t('search.global')}</span>
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>

            {/* Mobile search icon */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label={t('common.search')}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <NotificationsDropdown />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/10 transition-all hover:ring-primary/30">
                    <AvatarImage src="" alt={user?.name || 'Usuario'} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>{t('settings.profile')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>{t('nav.settings')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Header;
