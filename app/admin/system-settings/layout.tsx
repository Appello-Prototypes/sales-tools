'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Settings,
  Users,
  Plug,
  FileText,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemSettingsLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: 'Users',
    href: '/admin/system-settings/users',
    icon: Users,
  },
  {
    title: 'Integrations',
    href: '/admin/system-settings/integrations',
    icon: Plug,
  },
  {
    title: 'Letter Settings',
    href: '/admin/system-settings/letter-settings',
    icon: FileText,
  },
  {
    title: 'Profile',
    href: '/admin/system-settings/profile',
    icon: User,
  },
];

export default function SystemSettingsLayout({ children }: SystemSettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      {/* Left Menu */}
      <aside className="w-64 bg-card border-r border-border p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system configuration
          </p>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/admin/system-settings' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}


