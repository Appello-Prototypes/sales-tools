'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Notify parent window if opened in popup
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_ERROR',
            error: decodeURIComponent(error)
          },
          window.location.origin
        );
        window.close();
      } else {
        // Redirect to login with error
        router.push(`/admin/login?error=${encodeURIComponent(error)}`);
      }
      return;
    }

    if (token) {
      // Store token in localStorage (for popup communication)
      localStorage.setItem('admin_token', token);
      
      // Also set cookie for server-side auth
      document.cookie = `admin_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      // Notify parent window if opened in popup
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_SUCCESS',
            token
          },
          window.location.origin
        );
        window.close();
      } else {
        // Redirect to dashboard
        router.push('/');
      }
    } else {
      // No token, redirect to login
      router.push('/admin/login?error=Missing authentication token');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

