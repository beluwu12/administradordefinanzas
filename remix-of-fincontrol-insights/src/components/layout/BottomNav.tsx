import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  BarChart3,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNav = () => {
  const { t } = useLanguage();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, labelKey: 'nav.home' },
    { to: '/transactions', icon: Receipt, labelKey: 'nav.transactions' },
    { to: '/budget', icon: Wallet, labelKey: 'nav.budget' },
    { to: '/goals', icon: Target, labelKey: 'nav.goals' },
    { to: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex min-w-[56px] min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:scale-105'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate max-w-[56px]">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
