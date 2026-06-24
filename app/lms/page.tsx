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
      router.push(role === 'student' ? '/lms/student' : role === 'instructor' ? '/lms/instructor' : '/lms/admin');
    }
  }, [router, session?.user, status]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-64 rounded-[2rem]" />
    </div>
  );
}
