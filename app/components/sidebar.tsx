'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import {
  Home,
  Building2,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    label: 'الصفحة الرئيسية',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'الشركات',
    href: '/dashboard/companies',
    icon: Building2,
  },
  {
    label: 'المزودين',
    href: '/dashboard/fournisseurs',
    icon: Truck,
  },
  {
    label: 'شركات العملة',
    href: '/dashboard/currency',
    icon: DollarSign,
  },
  {
    label: 'آخر المعاملات',
    href: '/dashboard/transactions',
    icon: Clock,
  },
  {
    label: 'الإحصائيات',
    href: '/dashboard/stats',
    icon: BarChart3,
  },
  {
    label: 'الإعدادات',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={cn(
      "w-64 bg-card border-e border-border h-screen flex flex-col fixed inset-y-0 start-0 z-50 transition-all duration-300",
      "lg:flex",
      "invisible lg:visible"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="shrink-0 h-14 w-14 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col text-start">
            <h1 className="text-lg font-black font-heading bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-none">Amir Nouadi</h1>
            <p className="text-[11px] text-orange-600 dark:text-orange-500/80 font-bold uppercase tracking-widest mt-1.5 leading-none">Management</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 font-normal overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          // Improved active state logic with trailing slash handling:
          const normalizePath = (p: string | null) => p?.endsWith('/') ? p.slice(0, -1) : p;
          const currentPath = normalizePath(pathname);
          const targetPath = normalizePath(item.href);

          const isActive = item.href === '/dashboard'
            ? currentPath === '/dashboard'
            : currentPath?.startsWith(targetPath || '');

          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-start text-sm group relative overflow-hidden',
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-orange-500/25 scale-[1.02] ring-1 ring-primary-foreground/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium'
                )}
              >
                {isActive && (
                  <div className="absolute start-0 top-0 bottom-0 w-1 bg-white/30 dark:bg-white/20" />
                )}
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                  isActive ? "scale-110 animate-pulse" : "group-hover:scale-110"
                )} />
                <span className="leading-none text-base font-heading z-10">{item.label}</span>

                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {mounted && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 rounded-xl mb-1 border border-border/50">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-4 w-4 text-primary" />
              ) : (
                <Sun className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-xs font-bold font-heading text-foreground">الوضع الليلي</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              className="scale-75 origin-left"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 h-10 text-sm font-bold font-heading rounded-xl"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
};

// Mobile Navigation Content Component (Reusing logic)
export const MobileSidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="shrink-0 h-11 w-11 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-800 overflow-hidden flex items-center justify-center p-1 shadow-md">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col text-start">
            <h1 className="text-lg font-bold font-heading bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-none">Amir Nouadi</h1>
            <p className="text-[11px] text-orange-600 dark:text-orange-500/80 font-bold uppercase mt-1.5 leading-none">نظام الإدارة</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          // Improved active state logic with trailing slash handling:
          const normalizePath = (p: string | null) => p?.endsWith('/') ? p.slice(0, -1) : p;
          const currentPath = normalizePath(pathname);
          const targetPath = normalizePath(item.href);

          const isActive = item.href === '/dashboard'
            ? currentPath === '/dashboard'
            : currentPath?.startsWith(targetPath || '');

          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <button
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-start text-sm group relative overflow-hidden',
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-orange-500/25 scale-[1.02] ring-1 ring-primary-foreground/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium'
                )}
              >
                {isActive && (
                  <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary-foreground/30 dark:bg-white/20" />
                )}
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                  isActive ? "scale-110 animate-pulse" : "group-hover:scale-110"
                )} />
                <span className="leading-none text-base font-heading z-10">{item.label}</span>

                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {mounted && (
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-orange-500" />
              )}
              <span className="text-sm font-bold font-heading">الوضع الليلي</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-destructive h-12 text-base font-bold font-heading rounded-xl"
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </Button>
      </div>
    </div >
  );
};
