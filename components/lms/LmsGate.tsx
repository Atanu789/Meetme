'use client';

import { useEffect, useState } from 'react';
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
  const [membershipReady, setMembershipReady] = useState(false);
  const [membershipAllowed, setMembershipAllowed] = useState(false);
  const role = normalizeLmsRole((session?.user as any)?.lmsRole || (session?.user as any)?.role);
  const allowedKey = allowed.join('|');
  const roleAllowed = allowed.includes(role);

  useEffect(() => {
    setMembershipReady(false);
    setMembershipAllowed(false);

    if (status === 'unauthenticated') {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent('/pricing')}`);
      return;
    }

    if (status === 'authenticated' && !roleAllowed) {
      router.push('/lms');
      return;
    }

    if (status === 'authenticated' && roleAllowed) {
      if (role === 'admin') {
        setMembershipAllowed(true);
        setMembershipReady(true);
        return;
      }

      void (async () => {
        try {
          const response = await fetch('/api/billing/subscription', { credentials: 'include' });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || !body.subscription?.active) {
            router.push('/pricing?reason=plan');
            return;
          }

          setMembershipAllowed(true);
        } finally {
          setMembershipReady(true);
        }
      })();
    }
  }, [allowedKey, redirectTo, role, roleAllowed, router, status]);

  if (status === 'loading' || (status === 'authenticated' && roleAllowed && !membershipReady)) {
    return (
      <div className="mx-auto w-full max-w-[80rem] px-3 py-6 sm:px-5">
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="mt-6 h-96 rounded-[2rem]" />
      </div>
    );
  }

  if (status !== 'authenticated' || !roleAllowed || !membershipAllowed) {
    return null;
  }

  return <>{children}</>;
}
