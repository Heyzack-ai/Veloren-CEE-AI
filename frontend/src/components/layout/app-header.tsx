'use client';

import { Bell, HelpCircle, Search, PanelLeft, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useLanguage, useTranslation } from '@/lib/i18n';
import type { SupportedLanguage } from '@/lib/i18n';

type AppHeaderProps = {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

export function AppHeader({ isSidebarCollapsed, onToggleSidebar }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const key = `header.user.role.${role}`;
    return t(key, undefined, role);
  };

  const handleLanguageChange = (nextLang: SupportedLanguage) => {
    setLang(nextLang);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 gap-2">
        {/* Sidebar toggle */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-1"
            onClick={onToggleSidebar}
            aria-label={t(isSidebarCollapsed ? 'header.toggle.expand' : 'header.toggle.collapse')}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Logo and App Name */}
        <Link href="/dashboard" className="flex items-center gap-3 mr-6">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </div>
          <span className="font-heading font-semibold text-lg hidden sm:inline-block">
            {t('header.brand')}
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('header.search.placeholder')}
              className="pl-9"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t('header.notifications')}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" aria-label={t('header.help')}>
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('header.language.switch')}
              >
                <Languages className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>{t('header.language.switch')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['fr', 'en'] as SupportedLanguage[]).map(code => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={code === lang ? 'font-semibold' : ''}
                >
                  {code === 'fr' ? t('header.language.fr') : t('header.language.en')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="w-fit text-xs mt-1">
                    {user && getRoleLabel(user.role)}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">{t('header.user.profile')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">{t('header.user.settings')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                {t('header.user.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}