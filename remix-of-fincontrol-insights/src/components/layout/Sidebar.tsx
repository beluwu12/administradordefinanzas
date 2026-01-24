import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  Tag,
  Wallet,
  Target,
  BarChart3,
  Settings,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { t } = useLanguage();

  const navItems = [
    { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/transactions', icon: Receipt, labelKey: 'nav.transactions' },
    { to: '/categories', icon: Tag, labelKey: 'nav.categories' },
    { to: '/budget', icon: Wallet, labelKey: 'nav.budget' },
    { to: '/goals', icon: Target, labelKey: 'nav.goals' },
    { to: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
    { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
  ];

  return (
    <aside className={cn('hidden md:flex w-64 flex-col border-r border-border bg-sidebar', className)}>
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
          <PiggyBank className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-sidebar-foreground">Tu Gestor</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'hover:translate-x-1',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <item.icon className="h-5 w-5" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-primary">{t('proTip.title')}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('proTip.message')}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
