"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import HeroAceternity from '../components/HeroAceternity';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (status === 'authenticated') {
      // If the user is already signed in, send them straight to the dashboard.
      // Use replace so landing isn't kept in history.
      router.replace('/dashboard');
    }
  }, [mounted, status, router]);

  const handleQuickCreateMeeting = async () => {
    if (status !== 'authenticated') {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent('/dashboard?create=1')}`);
      return;
    }

    router.push('/dashboard?create=1');
  };

  if (!mounted) return null;

  return (
    <div className="page-shell">
      <HeroAceternity />

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          { number: '99.9%', label: 'Meeting uptime target' },
          { number: 'Private', label: 'Room access with JWT' },
          { number: 'Stored', label: 'Chat and activity history' },
        ].map((stat) => (
          <div key={stat.label} className="surface rounded-3xl p-6">
            <div className="font-display text-3xl font-semibold text-slate-950">{stat.number}</div>
            <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
