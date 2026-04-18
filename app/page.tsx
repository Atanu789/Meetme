'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickCreateMeeting = async () => {
    if (status !== 'authenticated') {
      router.push('/sign-in');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Quick meeting',
          description: 'Started from home page',
          isPrivate: false,
          chatEnabled: true,
          recordingEnabled: false,
        }),
      });

      if (response.status === 401) {
        router.push('/sign-in');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const data = await response.json();
      router.push(`/room/${data.meetingId}`);
    } catch (error) {
      console.error('Quick create meeting failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="page-shell">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="animate-fade-in-up space-y-6 sm:space-y-7">
          <div className="space-y-4">
            <div className="pill w-fit">Video meetings, chat storage, private rooms</div>
            <h1 className="section-title font-display text-3xl font-semibold leading-[1.05] text-slate-950 sm:text-5xl md:text-6xl">
              Meetings that feel simple,
              <span className="gradient-text block">secure, and organized.</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Melanam brings video calls, saved chat history, room activity, and optional private-room JWT access into a single workspace teams can actually use.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {status === 'authenticated' ? (
              <>
                <Link href="/dashboard" className="button-primary w-full sm:w-auto">
                  Open dashboard
                </Link>
                <button onClick={() => void handleQuickCreateMeeting()} className="button-secondary w-full sm:w-auto" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create meeting'}
                </button>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="button-secondary w-full sm:w-auto">
                  Sign in
                </Link>
                <button onClick={() => router.push('/sign-in')} className="button-primary w-full sm:w-auto">
                  Create meeting
                </button>
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Private rooms', copy: 'JWT-protected sessions for controlled access.' },
              { title: 'Saved chat', copy: 'Persistent conversation history for each room.' },
              { title: 'Meeting history', copy: 'Track joins, leaves, and recording events.' },
            ].map((item) => (
              <div key={item.title} className="surface rounded-3xl p-5">
                <h3 className="font-display text-base font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-up">
          <div className="surface-strong rounded-[2rem] p-4 sm:p-6 lg:p-8">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl sm:p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Overview</p>
              <h2 className="mt-3 font-display text-xl font-semibold sm:text-2xl">A clean meeting workspace</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-300 sm:mt-6">
                {[
                  'Create a room in seconds from the dashboard.',
                  'Invite participants with a simple share link.',
                  'Store chat and activity for later reference.',
                  'Use JWT private rooms when access control matters.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-3">
              {[
                { number: '01', label: 'Plan' },
                { number: '02', label: 'Meet' },
                { number: '03', label: 'Review' },
              ].map((step) => (
                <div key={step.label} className="surface rounded-2xl p-4 text-center">
                  <div className="font-display text-2xl font-semibold text-slate-950">{step.number}</div>
                  <p className="mt-1 text-sm text-slate-500">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-3 md:mt-14 md:grid-cols-3">
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

