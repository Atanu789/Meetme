'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Download,
  FileOutput,
  FileText,
  LayoutGrid,
  Mic2,
  ScanText,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  BarChart3,
  MessageCircleQuestion,
  Shield,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/ui/footer';

const STATS: Array<{ value: number; suffix: string; label: string; decimals?: number }> = [
  { value: 1000, suffix: '+', label: 'Rooms created' },
  { value: 3, suffix: '', label: 'Clicks to start' },
  { value: 5, suffix: '', label: 'Built-in workflows' },
  { value: 1, suffix: '', label: 'Meeting → knowledge hub' },
];

const COMPETITORS = ['Melanam', 'Zoom', 'Google Meet', 'Microsoft Teams'] as const;

const COMPARISON_ROWS = [
  { label: 'Live captions', values: ['Yes', 'Often add-on', 'Limited', 'Yes'] },
  { label: 'AI summary', values: ['Built in', 'Add-on / plan-based', 'Limited', 'Add-on / plan-based'] },
  { label: 'Meeting → tasks', values: ['Built in', 'Manual', 'Manual', 'Manual'] },
  { label: 'Files inside the room', values: ['Yes', 'Limited', 'Limited', 'Yes'] },
  { label: 'Recording history', values: ['One page', 'Separate tools', 'Separate tools', 'Separate tools'] },
  { label: 'Silent feedback', values: ['Yes', 'No', 'No', 'No'] },
] as const;

const INSIGHTS = [
  { icon: Workflow, title: 'Meeting → tasks', desc: 'Turn decisions into tasks without leaving the call.', accent: 'from-cyan-500 to-blue-500' },
  { icon: BarChart3, title: 'Participation insights', desc: 'See who spoke, for how long, and how the room engaged.', accent: 'from-emerald-500 to-teal-500' },
  { icon: MessageCircleQuestion, title: 'Silent feedback', desc: 'Agree, confused, repeat, or interesting without interrupting flow.', accent: 'from-amber-500 to-orange-500' },
  { icon: Shield, title: 'Private by default', desc: 'Secure rooms and controlled access keep calls focused.', accent: 'from-violet-500 to-fuchsia-500' },
] as const;

const FEATURE_COLOR_MAP = {
  violet: {
    pill: 'bg-violet-50 dark:bg-violet-500/10',
    icon: 'text-violet-500',
    badge: 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400',
  },
  emerald: {
    pill: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'text-emerald-500',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  orange: {
    pill: 'bg-orange-50 dark:bg-orange-500/10',
    icon: 'text-orange-500',
    badge: 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400',
  },
  indigo: {
    pill: 'bg-indigo-50 dark:bg-indigo-500/10',
    icon: 'text-indigo-500',
    badge: 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400',
  },
  pink: {
    pill: 'bg-pink-50 dark:bg-pink-500/10',
    icon: 'text-pink-500',
    badge: 'border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-400',
  },
  sky: {
    pill: 'bg-sky-50 dark:bg-sky-500/10',
    icon: 'text-sky-500',
    badge: 'border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400',
  },
} as const;

type FeatureBadge = string | { label: string };

type FeatureItem = {
  icon: React.ElementType;
  title: string;
  description: string;
  badges?: FeatureBadge[];
  color: keyof typeof FEATURE_COLOR_MAP;
  size?: 'large';
};

type PricingItem = {
  icon: React.ElementType;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
  badge?: string;
};

const FEATURES: FeatureItem[] = [
  {
    icon: Brain,
    title: 'AI Meeting Assistant',
    description: 'Smart meeting notes, action-item extraction, and context-aware follow-ups for every room.',
    badges: ['AI notes', 'Action items', 'Summaries', 'Follow-up'],
    color: 'violet',
    size: 'large',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Rooms',
    description: 'JWT-protected access, invite-only links, and room controls that keep meetings private.',
    color: 'emerald',
  },
  {
    icon: ScanText,
    title: 'Live Captions',
    description: 'Realtime captions for clearer conversations, searchable transcripts, and easier review.',
    color: 'orange',
  },
  {
    icon: Upload,
    title: 'File Sharing',
    description: 'Send files, links, and meeting assets without leaving the room.',
    color: 'indigo',
  },
  {
    icon: FileOutput,
    title: 'Meeting Recaps',
    description: 'Export summaries, transcripts, and post-call notes in a clean handoff package.',
    color: 'pink',
  },
  {
    icon: Mic2,
    title: 'Live Collaboration',
    description: 'Stay aligned with team chat, shared context, and smooth handoffs across the call.',
    badges: [{ label: 'AI + TTS' }, { label: 'Mic sync' }, { label: 'Fullscreen' }],
    color: 'sky',
    size: 'large',
  },
] as const;

const STEPS = [
  { n: '01', icon: Upload, title: 'Create', desc: 'Spin up a private room in seconds.' },
  { n: '02', icon: Brain, title: 'Connect', desc: 'Invite teammates with secure links and live access controls.' },
  { n: '03', icon: FileText, title: 'Capture', desc: 'Let captions, notes, and AI summaries run in the background.' },
  { n: '04', icon: Download, title: 'Follow up', desc: 'Share recordings, transcripts, and next steps after the call.' },
] as const;

// Decorative doodles removed to simplify landing visuals.

function NumberTicker({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    const start = performance.now();
    const duration = 1100;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [value]);

  return (
    <>
      {new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(displayValue)}
    </>
  );
}

function GlowCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(79,70,229,0.12)] dark:border-white/[0.08] dark:bg-[#0e0e16] dark:shadow-[0_18px_60px_rgba(2,6,23,0.3)]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_45%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-visible px-5 pb-4 pt-16 sm:pt-18">
      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/90 px-3 py-1 backdrop-blur-sm dark:border-brand-500/20 dark:bg-brand-500/10 font-display">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600">
            <Sparkles className="h-2 w-2 text-white" />
          </span>
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">Meeting platform built for action, not just calls</span>
          <ChevronRight className="h-3 w-3 text-brand-400" />
        </div>

        <h1 className="font-display text-[2.8rem] font-extrabold leading-[1.02] tracking-tight text-slate-900 dark:text-white sm:text-[4.3rem] lg:text-[5.8rem]">
          Meetings that turn into{' '}
          <span style={{ background: 'linear-gradient(90deg, var(--aceternity-sky), var(--aceternity-mint))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            clear next steps
          </span>
          .
        </h1>

        <p className="mx-auto mt-5 max-w-3xl text-[1.01rem] leading-relaxed text-slate-500 dark:text-white/45 sm:text-[1.08rem]">
          Melanam combines video, captions, summary, tasks, polls, files, and participation analytics in one place so teams spend less time switching tools.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="font-display group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5.5 py-3 text-[0.95rem] font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-emerald-400 hover:shadow-cyan-500/35 active:scale-[0.97]"
          >
            START
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#compare"
            className="font-display inline-flex items-center gap-2 rounded-xl border border-cyan-200/70 bg-cyan-50/70 px-5 py-3 text-[0.95rem] font-semibold text-cyan-700 transition-all hover:border-cyan-300 hover:bg-cyan-100/80 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-200 dark:hover:bg-cyan-300/15"
          >
            Compare plans
          </a>
          <Link
            href="/pricing"
            className="font-display inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-5 py-3 text-[0.95rem] font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
          >
            Pricing
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 border-y border-slate-100 py-4 dark:border-white/[0.06]">
          {STATS.map(({ value, suffix, label, decimals }) => (
            <div key={label} className="min-w-[64px] flex flex-col items-center gap-0.5">
                <span className="font-display text-[1.4rem] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[1.55rem]">
                <NumberTicker value={value} decimals={decimals} />
                {suffix}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-white/25">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {[...Array(5)].map((_, index) => (
            <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="ml-1 text-xs text-slate-400 dark:text-white/25">Trusted by teams running daily syncs</span>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section id="compare" className="relative overflow-hidden px-5 pb-10 pt-0 sm:px-8 sm:pt-0">
      <div className="mx-auto max-w-6xl relative z-10">
        <div className="mb-3 flex items-center gap-3 sm:mb-4">
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4 text-brand-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-400">Comparison</span>
          </div>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
          <h2 className="font-display text-sm font-semibold text-slate-500 dark:text-white/30">Why Melanam feels lighter for the same meeting job</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <GlowCard className="p-4 sm:p-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-slate-950/70">
              <div className="grid grid-cols-4 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/[0.04] dark:text-white/35">
                {COMPETITORS.map((item, index) => (
                  <div key={item} className={cn('px-3 py-3 text-center', index === 0 && 'bg-cyan-50/90 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300')}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.label} className="grid grid-cols-4 text-sm">
                    <div className="px-3 py-3 font-medium text-slate-700 dark:text-white/80">{row.label}</div>
                    {row.values.map((value, index) => {
                      const isMelanam = index === 0;
                      const isYes = value.toLowerCase().includes('yes') || value.toLowerCase().includes('built in') || value.toLowerCase().includes('one page');
                      return (
                        <div
                          key={`${row.label}-${value}-${index}`}
                          className={cn(
                            'flex items-center justify-center px-3 py-3 text-center text-xs font-semibold sm:text-sm',
                            isMelanam
                              ? 'bg-cyan-50/70 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200'
                              : isYes
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-slate-400 dark:text-white/25'
                          )}
                        >
                          {isYes ? <Check className={cn('mr-1 h-3.5 w-3.5', isMelanam ? 'text-cyan-600' : 'text-emerald-500')} /> : null}
                          <span>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {INSIGHTS.map(({ icon: Icon, title, desc, accent }) => (
              <GlowCard key={title} className="p-5">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-[17px] font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-slate-500 dark:text-white/40">{desc}</p>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureInfographic() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {INSIGHTS.map(({ icon: Icon, title, desc, accent }, index) => (
          <GlowCard key={title} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', accent)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/25">0{index + 1}</div>
                  <h3 className="font-display text-[16px] font-semibold text-slate-900 dark:text-white">{title}</h3>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-400 dark:text-white/20">{index === 0 ? 'Core' : 'New'}</div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500 dark:text-white/35">{desc}</p>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

function WorkflowStrip() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
      <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white/85 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.05] dark:shadow-[0_20px_46px_rgba(2,6,23,0.4)]">
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 dark:divide-white/[0.06] sm:grid-cols-4 sm:divide-y-0">
          {STEPS.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black tabular-nums text-indigo-400 dark:text-indigo-500">{n}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                  <Icon className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <span className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-400 dark:text-white/30">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="relative px-5 pb-14 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-display text-[11px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Workflow</span>
          </div>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
          <span className="font-display text-sm font-semibold text-slate-500 dark:text-white/30">Simple, secure, and fast</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, icon: Icon, title, desc }) => (
            <GlowCard key={n} className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black tabular-nums text-indigo-400 dark:text-indigo-500">{n}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                  <Icon className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{title}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-400 dark:text-white/25">{desc}</p>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-8 sm:px-8">
      <div className="rounded-2xl border border-slate-300/80 bg-white/86 shadow-[0_22px_52px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.05] dark:shadow-[0_22px_56px_rgba(2,6,23,0.42)]">
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:gap-8 sm:px-10 sm:py-8 sm:text-left">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-[1.7rem] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[2.2rem]">Ready to replace scattered meeting tools?</h2>
            <p className="mt-1 text-[0.98rem] text-slate-500 dark:text-white/40">
              Create a room, compare it against the usual stack, and let Melanam handle the meeting-to-knowledge flow.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="font-display group inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-emerald-400 active:scale-[0.97]"
          >
            Start a meeting
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.body.classList.add('landing-page');

    return () => {
      document.body.classList.remove('landing-page');
    };
  }, []);

  return (
    <div className="relative isolate -mt-16 min-h-screen overflow-hidden bg-transparent text-slate-900 flex flex-col">
      <div className="relative z-10 flex-1">
        <HeroSection />
        <ComparisonSection />
        <FeatureInfographic />
        <WorkflowStrip />
        <CtaSection />
      </div>
      <Footer />
    </div>
  );
}
