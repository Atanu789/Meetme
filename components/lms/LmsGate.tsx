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
          let response = await fetch('/api/billing/usage', { credentials: 'include' });
          let body = await response.json().catch(() => ({}));

          // A first-time signed-in user should enter the LMS on Free rather
          // than be bounced to pricing. Never overwrite an existing inactive
          // or paid membership here; only a missing membership is provisioned.
          if (!response.ok && body.code === 'PLAN_REQUIRED') {
            const membershipResponse = await fetch('/api/billing/subscription', { credentials: 'include' });
            const membershipBody = await membershipResponse.json().catch(() => ({}));
            if (membershipResponse.ok && !membershipBody.subscription) {
              const activateResponse = await fetch('/api/billing/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan: 'free', notes: 'Free plan activated on first LMS visit' }),
              });

              if (activateResponse.ok) {
                response = await fetch('/api/billing/usage', { credentials: 'include' });
                body = await response.json().catch(() => ({}));
              }
            }
          }

          if (!response.ok || !body.workspace) {
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
