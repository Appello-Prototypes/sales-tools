'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Settings } from 'lucide-react';

export default function SystemSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to users page by default
    router.replace('/admin/system-settings/users');
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting to System Settings...</p>
      </div>
    </div>
  );
}


