'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  List, 
  Mail, 
  LogOut,
  Menu,
  X,
  Settings,
  Calculator,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Plus,
  Building2,
  Users,
  TrendingUp,
  LayoutDashboard,
  Plug,
  User,
  Sparkles,
  Zap,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
import { IntelligenceHubBadge } from '@/components/admin/IntelligenceHubBadge';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  title: string;
  href: string;
  icon: any;
}

interface MenuGroup {
  title: string;
  icon?: any;
  href?: string;
  items?: MenuItem[];
  expandable?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: 'CRM',
    icon: Building2,
    expandable: true,
    items: [
      {
        title: 'Dashboard',
        href: '/admin/crm',
        icon: LayoutDashboard,
      },
      {
        title: 'Intelligence Hub',
        href: '/admin/intelligence',
        icon: Brain,
      },
      {
        title: 'Deals',
        href: '/admin/crm/deals',
        icon: TrendingUp,
      },
      {
        title: 'Contacts',
        href: '/admin/crm/contacts',
        icon: Users,
      },
      {
        title: 'Companies',
        href: '/admin/crm/companies',
        icon: Building2,
      },
    ],
  },
  {
    title: 'Assessments',
    icon: FileText,
    expandable: true,
    items: [
      {
        title: 'Assessment Form',
        href: '/admin/assessment-form',
        icon: FileText,
      },
      {
        title: 'All Submissions',
        href: '/admin/submissions',
        icon: List,
      },
    ],
  },
  {
    title: 'Estimates',
    icon: Calculator,
    expandable: true,
    items: [
      {
        title: 'All Estimates',
        href: '/admin/estimates',
        icon: ClipboardList,
      },
      {
        title: 'Create Estimate',
        href: '/admin/estimates/create',
        icon: Plus,
      },
    ],
  },
  {
    title: 'Sales Tools',
    icon: Mail,
    expandable: true,
    items: [
      {
        title: 'Letter Studio',
        href: '/admin/letter-studio',
        icon: Sparkles,
      },
      {
        title: 'Letter Agents',
        href: '/admin/agents',
        icon: Zap,
      },
    ],
  },
  {
    title: 'System Settings',
    icon: Settings,
    href: '/admin/system-settings',
  },
];

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  // Use dark logo for light mode, white logo for dark mode
  // Only use theme-dependent logo after mount to avoid hydration mismatch
  const logoSource = mounted && resolvedTheme === 'dark' ? "/Appello-Logo-White.svg" : "/Appello-Logo-Dark.svg";
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'CRM': pathname?.startsWith('/admin/crm') || pathname?.startsWith('/admin/intelligence'),
    'Assessments': pathname?.startsWith('/admin/assessment') || pathname?.startsWith('/admin/submissions') || pathname?.startsWith('/admin/assessments'),
    'Estimates': pathname?.startsWith('/admin/estimates') || pathname?.startsWith('/admin/pricing-calculator'),
    'Sales Tools': pathname?.startsWith('/admin/letter-studio') || pathname?.startsWith('/admin/sales-tools') || pathname?.startsWith('/admin/agents'),
  });

  useEffect(() => {
    setMounted(true);
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={logoSource}
            alt="Appello Logo"
            width={75}
            height={20}
            className="h-auto"
            priority
          />
          <div className="h-6 w-px bg-border"></div>
          <div className="flex flex-col">
            <span className="catalyst-brand text-xl font-bold tracking-tight">Catalyst</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sales Tools</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IntelligenceHubBadge />
          <ThemeToggle />
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full p-0"
                >
                  {user ? (
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {getInitials(user.name)}
                    </div>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user && (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/admin/system-settings/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/system-settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>System Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!mounted && (
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
              <User className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop header */}
      <header className="hidden lg:block bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={logoSource}
              alt="Appello Logo"
              width={90}
              height={24}
              className="h-auto"
              priority
            />
            <div className="h-8 w-px bg-border"></div>
            <div className="flex flex-col">
              <span className="catalyst-brand text-2xl font-bold tracking-tight leading-tight">Catalyst</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sales Tools</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IntelligenceHubBadge />
            <ThemeToggle />
            {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-full px-2 gap-2"
                >
                  {user ? (
                    <>
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <span className="hidden md:inline-block text-sm font-medium">{user.name}</span>
                    </>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user && (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/admin/system-settings/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/system-settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>System Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" className="h-10 rounded-full px-2 gap-2">
              <User className="h-5 w-5" />
            </Button>
          )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-card border-r border-border
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {menuGroups.map((group, groupIndex) => {
                const GroupIcon = group.icon;
                const isExpanded = expandedGroups[group.title] ?? false;
                
                // Check if any item in this group is active
                const hasActiveItem = group.items?.some(item => {
                  return pathname === item.href || 
                    (item.href !== '/' && pathname?.startsWith(item.href + '/')) ||
                    (item.href === '/admin/submissions' && pathname?.startsWith('/admin/assessments/'));
                });
                
                // Single page menu item (non-expandable)
                if (!group.expandable && group.href) {
                  const isActive = pathname === group.href || pathname?.startsWith(group.href + '/');
                  return (
                    <Link
                      key={groupIndex}
                      href={group.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2
                        transition-colors text-sm font-medium
                        ${
                          isActive
                            ? 'bg-accent text-accent-foreground border-l-4 border-primary'
                            : 'text-foreground hover:bg-muted'
                        }
                      `}
                    >
                      {GroupIcon && <GroupIcon className="h-4 w-4 flex-shrink-0" />}
                      <span>{group.title}</span>
                    </Link>
                  );
                }
                
                // Expandable menu group
                return (
                  <div key={groupIndex} className="space-y-0">
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.title]: !isExpanded }))}
                      className={`
                        w-full flex items-center justify-between px-3 py-2
                        transition-colors text-sm font-medium
                        ${
                          hasActiveItem
                            ? 'bg-accent text-accent-foreground border-l-4 border-primary'
                            : 'text-foreground hover:bg-muted'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {GroupIcon && <GroupIcon className="h-4 w-4 flex-shrink-0" />}
                        <span>{group.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && group.items && (
                      <div className="space-y-0">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname?.startsWith(item.href + '/')) ||
                            (item.href === '/admin/submissions' && pathname?.startsWith('/admin/assessments/'));
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                flex items-center gap-3 px-3 py-2 pl-11
                                transition-colors text-sm
                                relative
                                ${
                                  isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                                }
                              `}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                              )}
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{item.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors px-3 py-2"
              >
                <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-0 overflow-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

