/**
 * @deprecated This page is deprecated. Please use Letter Studio instead.
 * 
 * Letter Studio provides:
 * - AI-powered multiagent research
 * - Complete session history
 * - Draft versioning
 * - Enhanced research insights
 * 
 * Redirect to: /admin/letter-studio
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ColdCallLettersPage() {
  const router = useRouter();
  
  // Redirect to Letter Studio on mount
  useEffect(() => {
    router.replace('/admin/letter-studio');
  }, [router]);
  
  // Return loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Letter Studio...</p>
      </div>
    </div>
  );
}
