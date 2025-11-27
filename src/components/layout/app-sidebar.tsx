'use client';

import {
  LayoutDashboard,
  FileText,
  Upload,
  Settings,
  Users,
  BarChart3,
  Activity,
  Folder,
  CheckSquare,
  CreditCard,
  Cog,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
};

type AppSidebarProps = {
  collapsed?: boolean;
};

const adminNavItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Dossiers',
    href: '/dossiers',
    icon: Folder,
    badge: 12,
    children: [
      { title: 'Tous les dossiers', href: '/dossiers', icon: FileText },
      { title: 'En attente', href: '/dossiers?status=awaiting_review', icon: FileText, badge: 8 },
      { title: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    title: 'Configuration',
    href: '/config',
    icon: Cog,
    children: [
      { title: 'Processus', href: '/config/processes', icon: Cog },
      { title: 'Règles de validation', href: '/config/rules', icon: CheckSquare },
      { title: 'Schémas de champs', href: '/config/schemas', icon: FileText },
    ],
  },
  {
    title: 'Utilisateurs',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Installateurs',
    href: '/installers',
    icon: Users,
  },
  {
    title: 'Facturation',
    href: '/billing',
    icon: CreditCard,
  },
  {
    title: 'Analytique',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Journal d\'activité',
    href: '/activity',
    icon: Activity,
  },
  {
    title: 'Paramètres',
    href: '/settings',
    icon: Settings,
  },
];

const validatorNavItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Dossiers',
    href: '/dossiers',
    icon: Folder,
    children: [
      { title: 'Ma file', href: '/validation', icon: CheckSquare, badge: 5 },
      { title: 'Tous les dossiers', href: '/dossiers', icon: FileText },
      { title: 'En attente', href: '/dossiers?status=awaiting_review', icon: FileText },
      { title: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    title: 'Facturation',
    href: '/billing',
    icon: CreditCard,
  },
  {
    title: 'Paramètres',
    href: '/settings',
    icon: Settings,
  },
];

const installerNavItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mes dossiers',
    href: '/my-dossiers',
    icon: Folder,
  },
  {
    title: 'Nouveau dossier',
    href: '/upload',
    icon: Upload,
  },
  {
    title: 'Mes paiements',
    href: '/my-payments',
    icon: CreditCard,
  },
  {
    title: 'Paramètres',
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = 
    user?.role === 'administrator' ? adminNavItems :
    user?.role === 'validator' ? validatorNavItems :
    installerNavItems;

  return (
    <aside
      className={cn(
        'border-r bg-sidebar h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className={cn('p-4 space-y-1', collapsed && 'px-2') }>
        {navItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                collapsed && 'justify-center',
                pathname === item.href
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
            {!collapsed && item.children && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      pathname === child.href
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                    )}
                  >
                    <child.icon className="h-3 w-3" />
                    <span className="flex-1">{child.title}</span>
                    {child.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {child.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}