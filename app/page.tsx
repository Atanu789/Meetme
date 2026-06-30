'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  FileText,
  LineChart,
  MessageSquare,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Video,
  Wand2,
} from 'lucide-react';
import { Footer } from '@/components/ui/footer';

const metrics = [
  { value: 3, suffix: ' sec', label: 'launch flow', tone: 'from-cyan-400 to-blue-500' },
  { value: 6, suffix: '', label: 'room tools', tone: 'from-emerald-400 to-teal-500' },
  { value: 24, suffix: '/7', label: 'learning hub', tone: 'from-violet-400 to-indigo-500' },
  { value: 1, suffix: ' place', label: 'calls to actions', tone: 'from-amber-400 to-orange-500' },
];

const capabilities = [
  { icon: Video, title: 'HD meeting rooms', desc: 'Private Jitsi-powered rooms with invite links, recording, livestream, and captions.' },
  { icon: BookOpen, title: 'Role LMS dashboards', desc: 'Student, instructor, and admin workspaces with courses, sessions, assignments, and resources.' },
  { icon: Brain, title: 'AI meeting memory', desc: 'Transcripts, summaries, action items, decisions, and follow-up tasks after the call.' },
  { icon: UploadCloud, title: 'Files and whiteboard', desc: 'Share resources and keep persistent whiteboards attached to the meeting context.' },
  { icon: MessageSquare, title: 'Polls and feedback', desc: 'Gather quick signals without interrupting the flow of class or team discussion.' },
  { icon: BarChart3, title: 'Participation analytics', desc: 'A cleaner way to see engagement, recordings, and learning activity over time.' },
];

const workflow = [
  ['Create', 'Start a room or class session from the LMS dashboard.'],
  ['Collaborate', 'Use video, captions, chat, files, polls, and whiteboard together.'],
  ['Capture', 'Recordings, transcripts, and notes become searchable context.'],
  ['Continue', 'Tasks, submissions, and resources stay connected to the course.'],
];

const dashboardRows = [
  { label: 'Live sessions', value: 84, color: 'bg-cyan-400' },
  { label: 'Assignments', value: 67, color: 'bg-emerald-400' },
  { label: 'Recordings', value: 52, color: 'bg-violet-400' },
  { label: 'Resources', value: 74, color: 'bg-amber-400' },
];

function NumberTicker({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value]);

  return <>{Math.round(displayValue)}</>;
}

function PremiumCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function HeroPreview() {
  return (
    <PremiumCard className="p-4 sm:p-5">
      <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">Live room</p>
            <h3 className="mt-1 font-display text-lg font-semibold">Advanced Physics Lab</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Recording
          </span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-[280px] overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(34,211,238,0.25),transparent_30%),radial-gradient(circle_at_78%_68%,rgba(52,211,153,0.18),transparent_34%)]" />
            <div className="relative grid h-full grid-cols-2 gap-3">
              {['Instructor', 'Student A', 'Student B', 'Shared board'].map((item, index) => (
                <div key={item} className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-white/10 bg-white/8 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{item}</span>
                    <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-emerald-300' : 'bg-cyan-300'}`} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[48, 70, 38].map((height, barIndex) => (
                      <div key={barIndex} className="flex h-12 items-end rounded-full bg-white/8 p-1">
                        <div className="w-full rounded-full bg-cyan-200" style={{ height: `${height + index * 4}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { label: 'Captions', value: 'Real-time', icon: Radio },
              { label: 'Summary', value: 'Auto draft', icon: Brain },
              { label: 'Files', value: '12 shared', icon: FileText },
              { label: 'Whiteboard', value: 'Saved', icon: Wand2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-slate-300">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}

function FeatureCard({ icon: Icon, title, desc }: (typeof capabilities)[number]) {
  return (
    <PremiumCard className="feature-marquee-card group w-[min(25rem,82vw)] shrink-0 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 text-white shadow-lg shadow-cyan-500/20">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
        </div>
      </div>
    </PremiumCard>
  );
}

function FeatureMarqueeRow({
  items,
  reverse = false,
}: {
  items: typeof capabilities;
  reverse?: boolean;
}) {
  const repeatedItems = [...items, ...items];

  return (
    <div className="feature-marquee-mask overflow-hidden py-2">
      <div className={`feature-marquee-track flex w-max gap-4 ${reverse ? 'feature-marquee-track--reverse' : ''}`}>
        {repeatedItems.map((item, index) => (
          <FeatureCard key={`${item.title}-${index}`} {...item} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative isolate -mt-16 min-h-screen overflow-hidden text-slate-950">
      <section className="mx-auto grid w-full max-w-[80rem] gap-10 px-3 pb-14 pt-28 sm:px-5 lg:grid-cols-[0.92fr_1.08fr] lg:pt-32">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Premium meeting OS
          </div>
          <h1 className="mt-6 font-display text-4xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Meetings, LMS, AI notes, and action follow-up in one smooth workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Melanam turns live classes and team meetings into saved context: captions, recordings, whiteboards,
            files, tasks, polls, summaries, and course workflows without the messy tab switching.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_42px_rgba(15,23,42,0.22)] transition hover:-translate-y-1">
              Start free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/lms" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-5 py-3 text-sm font-bold text-slate-900 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white">
              Open LMS
              <Play className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className={`mb-3 h-1.5 rounded-full bg-gradient-to-r ${metric.tone}`} />
                <div className="font-display text-2xl font-black">
                  <NumberTicker value={metric.value} />
                  {metric.suffix}
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
        <HeroPreview />
      </section>

      <section id="features" className="mx-auto w-full max-w-[80rem] px-3 pb-12 sm:px-5">
        <div className="space-y-3">
          <FeatureMarqueeRow items={capabilities} />
          <FeatureMarqueeRow items={[...capabilities.slice(3), ...capabilities.slice(0, 3)]} reverse />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[80rem] gap-5 px-3 pb-12 sm:px-5 lg:grid-cols-[0.85fr_1.15fr]">
        <PremiumCard className="bg-slate-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">Dashboard intelligence</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">One cockpit for learning and meetings.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            The LMS pages now emphasize flow: course health, upcoming sessions, assignment load, resources,
            recordings, and meeting launch actions in a single premium dashboard rhythm.
          </p>
          <div className="mt-6 space-y-4">
            {dashboardRows.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>{row.label}</span>
                  <span>{row.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {workflow.map(([title, desc], index) => (
              <div key={title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-black text-slate-200">0{index + 1}</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </PremiumCard>
      </section>

      <section className="mx-auto w-full max-w-[80rem] px-3 pb-16 sm:px-5">
        <PremiumCard className="p-5 sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                <LineChart className="h-4 w-4" />
                Smooth by design
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold text-slate-950">A calm premium palette with useful motion.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Cyan, emerald, slate, violet, and amber accents keep the product bright but professional.
                Cards are soft, controls are clear, and wide sections are clipped to prevent page-level horizontal scroll.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
            {[
                { label: 'Secure', icon: ShieldCheck, helper: 'Private rooms and role gates' },
                { label: 'Live', icon: CalendarClock, helper: 'Classes, captions, and recordings' },
                { label: 'Together', icon: Users, helper: 'Whiteboard, files, polls, tasks' },
              ].map(({ label, icon: Icon, helper }) => (
                <div key={label} className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
                  <Icon className="h-6 w-6 text-cyan-600" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-950">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
                </div>
              ))}
            </div>
          </div>
        </PremiumCard>
      </section>

      <Footer />
    </div>
  );
}
