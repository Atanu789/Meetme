'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeLmsRole } from '@/lib/lms-role';

export default function LmsLandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent('/lms')}`);
      return;
    }

    if (status === 'authenticated') {
      const role = normalizeLmsRole((session?.user as any)?.lmsRole || (session?.user as any)?.role);
      if (role === 'admin') {
        router.push('/lms/admin');
        return;
      }

      void (async () => {
        const response = await fetch('/api/billing/subscription', { credentials: 'include' });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.subscription?.active) {
          router.push('/pricing?reason=plan');
          return;
        }

        router.push(role === 'student' ? '/lms/student' : '/lms/instructor');
      })();
    }
  }, [router, session?.user, status]);

  return (
    <div className="mx-auto w-full max-w-[80rem] px-3 py-6 sm:px-5">
      <Skeleton className="h-64 rounded-[2rem]" />
    </div>
  );
}
