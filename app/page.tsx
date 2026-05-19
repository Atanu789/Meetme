'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BentoCard, BentoGrid } from '../components/ui/bento-grid';
import { GithubGlobe } from '../components/ui/github-globe';
import { GlowCard } from '../components/ui/glow-card';
import { GradientBorderButton } from '../components/ui/gradient-border-button';
import { Marquee } from '../components/ui/marquee';
import { SectionHeading } from '../components/ui/section-heading';
import { Footer } from '../components/ui/footer';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (status === 'authenticated') {
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

  const handleQuickJoinMeeting = async () => {
    if (status !== 'authenticated') {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent('/dashboard?join=1')}`);
      return;
    }

    router.push('/dashboard?join=1');
  };

  const highlights = useMemo(
    () => [
      {
        eyebrow: 'Security',
        title: 'Rooms with intent',
        description: 'JWT gates, invite-only links, and per-room controls for every session.',
      },
      {
        eyebrow: 'Clarity',
        title: 'Live captions + AI notes',
        description: 'Realtime captions, searchable summaries, and easy follow-ups after every call.',
      },
      {
        eyebrow: 'Workflow',
        title: 'One dashboard for it all',
        description: 'See active rooms, meeting stats, and recent activity in a single command center.',
      },
    ],
    []
  );

  const workflow = useMemo(
    () => [
      {
        eyebrow: 'Step 01',
        title: 'Spin up a room',
        description: 'Launch a new room with auto-generated links and smart defaults.',
      },
      {
        eyebrow: 'Step 02',
        title: 'Invite the team',
        description: 'Share a secure link and keep participation tracked with activity telemetry.',
      },
      {
        eyebrow: 'Step 03',
        title: 'Ship the recap',
        description: 'Send recordings, chat history, and AI summaries in one clean package.',
      },
    ],
    []
  );

  const testimonials = useMemo(
    () => [
      {
        title: 'Meetings feel calm',
        description: 'Teams love the guided flow and the focus on clarity after each call.',
      },
      {
        title: 'Fast setup',
        description: 'We can open a private room in seconds without losing time.',
      },
      {
        title: 'Recaps stay useful',
        description: 'Captions and summaries are always ready for follow-up work.',
      },
      {
        title: 'Control is simple',
        description: 'We lock rooms down with JWT while keeping the UX lightweight.',
      },
    ],
    []
  );

  if (!mounted) return null;

  return (
    <div className="page-shell space-y-16">
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.18),transparent_45%),radial-gradient(circle_at_86%_24%,rgba(16,185,129,0.14),transparent_42%),radial-gradient(circle_at_68%_82%,rgba(251,191,36,0.16),transparent_46%)]" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500"
            >
              Aceternity-inspired workspace
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl"
            >
              Meetings designed to feel calm, focused, and ready to ship.
              <span className="mt-3 block bg-[linear-gradient(135deg,#0f172a_0%,#0ea5e9_45%,#22c55e_100%)] bg-clip-text text-transparent">
                Bring every room into a single, elegant command center.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="max-w-xl text-base text-slate-600"
            >
              Melanam blends secure rooms, live captions, and post-meeting intelligence into a unified flow. Every step feels intentional, from first invite to final recap.
            </motion.p>
            <div className="flex flex-wrap items-center gap-3">
              <GradientBorderButton variant="create" onClick={handleQuickCreateMeeting}>
                Create meeting
              </GradientBorderButton>
              <GradientBorderButton variant="join" onClick={handleQuickJoinMeeting}>
                Join meeting
              </GradientBorderButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: '99.9%', label: 'Uptime target' },
                { value: 'JWT', label: 'Private access' },
                { value: 'AI', label: 'Realtime notes' },
              ].map((stat) => (
                <GlowCard key={stat.label} className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                  <p className="mt-3 font-display text-2xl font-semibold text-slate-950">{stat.value}</p>
                </GlowCard>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <GithubGlobe className="w-full max-w-[460px]" />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          kicker="Signal stack"
          title="Every layer tuned for clarity"
          description="Aceternity-style surfaces, depth, and motion keep your team grounded and ready to act."
        />
        <BentoGrid className="md:grid-cols-3">
          {highlights.map((item) => (
            <BentoCard
              key={item.title}
              eyebrow={item.eyebrow}
              title={item.title}
              description={item.description}
            />
          ))}
        </BentoGrid>
      </section>

      <section className="space-y-8">
        <SectionHeading
          kicker="Workflow"
          title="From invite to recap in three moves"
          description="Each room carries context forward so follow-ups take minutes, not days."
        />
        <BentoGrid className="md:grid-cols-3">
          {workflow.map((item) => (
            <BentoCard
              key={item.title}
              eyebrow={item.eyebrow}
              title={item.title}
              description={item.description}
            />
          ))}
        </BentoGrid>
      </section>

      <section className="space-y-8">
        <SectionHeading
          kicker="Teams"
          title="People talk. The product follows."
          description="Design language and UX patterns built to feel familiar to Aceternity UI fans."
        />
        <Marquee items={testimonials} />
      </section>

      <section>
        <GlowCard className="p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Ready to start</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950">
                Build your next room with a calmer, more deliberate flow.
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Create a room in seconds, invite your team, and let the workspace handle the rest.
              </p>
            </div>
            <div className="flex flex-col items-start justify-center gap-3">
              <GradientBorderButton variant="create" onClick={handleQuickCreateMeeting}>
                Create meeting
              </GradientBorderButton>
              <GradientBorderButton variant="join" onClick={handleQuickJoinMeeting}>
                Join a room
              </GradientBorderButton>
            </div>
          </div>
        </GlowCard>
      </section>
      <Footer />
    </div>
  );
}
