'use client';

import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { HubSpotDataProvider } from '@/components/admin/HubSpotDataProvider';

export default function AdminPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't wrap login page with AdminLayout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  return (
    <HubSpotDataProvider autoLoad={true} autoSync={false}>
      <AdminLayout>{children}</AdminLayout>
    </HubSpotDataProvider>
  );
}

