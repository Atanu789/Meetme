'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeLmsRole, LmsRole } from '@/lib/lms-role';

export function LmsGate({
  allowed,
  redirectTo,
  children,
}: {
  allowed: LmsRole[];
  redirectTo: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = normalizeLmsRole((session?.user as any)?.lmsRole || (session?.user as any)?.role);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(redirectTo)}`);
      return;
    }

    if (status === 'authenticated' && !allowed.includes(role)) {
      router.push('/lms');
    }
  }, [allowed, redirectTo, role, router, status]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="mt-6 h-96 rounded-[2rem]" />
      </div>
    );
  }

  if (status !== 'authenticated' || !allowed.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
