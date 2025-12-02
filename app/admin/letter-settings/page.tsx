'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LetterSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/system-settings/letter-settings');
  }, [router]);

  return null;
}
