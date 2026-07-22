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

const meetingParticipants = [
  { role: 'Teacher', name: 'Dr. Sen', tone: 'from-cyan-300 to-sky-400', delay: '0ms' },
  { role: 'Student', name: 'Aarav', tone: 'from-emerald-300 to-teal-400', delay: '150ms' },
  { role: 'Student', name: 'Mira', tone: 'from-violet-300 to-fuchsia-400', delay: '300ms' },
];

const meetingFlow = [
  { label: 'Create', helper: 'Room starts', icon: Video },
  { label: 'Join', helper: 'Class connects', icon: Users },
  { label: 'Discuss', helper: 'Board + captions', icon: Radio },
  { label: 'Save', helper: 'AI notes ready', icon: Brain },
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
  {/* Main Wrapper: Greyish tint with box shadow, glassmorphism retained */}
  <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-400/50 p-5 shadow-slate-300/60 border border-white/60 backdrop-blur-xl">
      

    {/* Minimal Classy Animations */}
    <style>{`
      @keyframes subtleAudio {
        0%, 100% { transform: scaleY(0.5); }
        50% { transform: scaleY(1.5); }

      }
      @keyframes floatMinimal {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
    `}</style>

    {/* Header */}
    <div className="relative z-10 flex items-center justify-between gap-3 border-b border-slate-300/50 pb-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
          Live room
        </p>
        <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-slate-900">
          Advanced Physics Lab
        </h3>
      </div>
      
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 shadow-sm">
        {/* Minimal Pulsing Dot */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Recording
      </span>
    </div>

    <div className="relative z-10 mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      
      {/* Left Column: Video Grid */}
      <div className="relative min-h-[280px] overflow-hidden rounded-[1.25rem] border border-white/60 bg-slate-100/40 p-4 shadow-inner">
        <div className="relative grid h-full grid-cols-2 gap-3">
          {[
            { name: 'Instructor', type: 'host', color: 'emerald' },
            { name: 'Student A', type: 'participant', color: 'cyan' },
            { name: 'Student B', type: 'participant', color: 'cyan' },
            { name: 'Shared board', type: 'system', color: 'slate' }
          ].map((item, index) => {
            const colorMap = {
              emerald: { dot: 'bg-emerald-500', bar: 'bg-emerald-400' },
              cyan: { dot: 'bg-cyan-500', bar: 'bg-cyan-400' },
              slate: { dot: 'bg-slate-400', bar: 'bg-slate-400' },
            };
            const colors = colorMap[item.color];

            return (
              <div 
                key={item.name} 
                className="flex min-h-[120px] flex-col justify-between rounded-xl border border-white/80 bg-white/50 p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-slate-700">
                    {item.name}
                  </span>
                  
                  {/* Active Speaker Indicator */}
                  <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                    {(item.name === 'Instructor' || item.name === 'Student A') && (
                      <span className={`absolute h-3 w-3 animate-ping rounded-full opacity-30 ${colors.dot}`} />
                    )}
                    <span className={`relative h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                  </span>
                </div>

                {/* Subtle Audio Equalizer */}
                <div className="flex w-16 items-end justify-between gap-[3px] rounded-lg bg-slate-200/60 p-1.5 h-8 border border-white/40">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div 
                      key={bar} 
                      className={`w-1 origin-bottom rounded-full ${colors.bar} ${item.type === 'system' ? 'opacity-40' : ''}`}
                      style={{
                        height: '100%',
                        animation: item.type !== 'system' 
                          ? `subtleAudio ${0.6 + (Math.random() * 0.4)}s ease-in-out infinite alternate`
                          : 'none',
                        animationDelay: `${index * 0.1 + bar * 0.1}s`,
                        transform: item.type === 'system' ? 'scaleY(0.4)' : 'scaleY(0.2)'
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Features */}
      <div className="grid gap-3">
        {[
          { label: 'Captions', value: 'Real-time syncing', icon: Radio, highlight: 'text-emerald-600', bg: 'bg-emerald-100/50' },
          { label: 'Summary', value: 'Auto-generating...', icon: Brain, highlight: 'text-cyan-600', bg: 'bg-cyan-100/50' },
          { label: 'Files', value: '12 assets shared', icon: FileText, highlight: 'text-blue-600', bg: 'bg-blue-100/50' },
          { label: 'Whiteboard', value: 'Cloud saved', icon: Wand2, highlight: 'text-indigo-600', bg: 'bg-indigo-100/50' },
        ].map(({ label, value, icon: Icon, highlight, bg }, index) => (
          <div 
            key={label} 
            className="flex items-center gap-3.5 rounded-xl border border-white/80 bg-white/50 p-3 shadow-sm backdrop-blur-sm"
            style={{
              animation: `floatMinimal 6s ease-in-out infinite`,
              animationDelay: `${index * 0.4}s`,
            }}
          >
            {/* Icon Box */}
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/60 ${bg} ${highlight}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800">
                {label}
              </p>
              <p className="mt-[1px] truncate text-[11px] font-medium text-slate-500">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  </div>

  <div className="mx-auto mt-4 max-w-[50rem] grid gap-4 sm:grid-cols-[1fr_1.2fr]">
    {/* Refined Glass Auto-Hover Animations (Retained as "normal" automatic effects) */}
    <style>{`
      @keyframes autoHoverIconGlass {
        0%, 25%, 100% { transform: scale(1); color: #64748b; background-color: #f1f5f9; border-color: rgba(255,255,255,0.6); }
        5%, 20% { transform: scale(1.08); color: #06b6d4; background-color: #ecfeff; border-color: #a5f3fc; }
      }
      @keyframes autoHoverCardGlass {
        0%, 25%, 100% { 
          transform: translateY(0); 
          background-color: rgba(255, 255, 255, 0.4); 
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02); 
        }
        5%, 20% { 
          transform: translateY(-3px); 
          background-color: rgba(255, 255, 255, 0.9); 
          border-color: rgba(165, 243, 252, 0.6);
          box-shadow: 0 10px 20px -5px rgba(6, 182, 212, 0.1); 
        }
      }
    `}</style>

    {/* Left Box: Participants Grid */}
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-slate-200/40 p-4 shadow-sm backdrop-blur-md">
      {/* Subtle float animations */}
      <style>{`
        @keyframes glassFloatLead {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes glassFloatPeer {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>

      <div className="relative grid h-full grid-cols-2 items-center gap-x-3 gap-y-4">
        {meetingParticipants.map((person, index) => {
          const isTeacher = index === 0;

          return (
            <div
              key={person.name}
              className={`relative flex flex-col items-center justify-between rounded-xl border border-white/80 bg-white/50 p-3 text-center shadow-sm backdrop-blur ${
                isTeacher 
                  ? 'col-span-2 mx-auto w-[65%] min-h-[120px]' 
                  : 'col-span-1 min-h-[105px]'
              }`}
              style={{
                animation: `${isTeacher ? 'glassFloatLead' : 'glassFloatPeer'} 4s ease-in-out infinite`,
                animationDelay: person.delay || `${index * 0.5}s`,
              }}
            >
              {/* Clean Glass Avatar */}
              <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${person.tone} font-bold text-slate-800 shadow-sm border border-white/80 ${
                isTeacher ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-xs'
              }`}>
                {person.name.charAt(0)}
                
                <span className={`absolute -right-0.5 top-0.5 rounded-full border-2 border-white bg-emerald-400 ${
                  isTeacher ? 'h-3 w-3' : 'h-2.5 w-2.5'
                }`} />
              </div>

              <div className="mt-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  {person.role}
                </p>
                <p className={`font-semibold text-slate-800 ${isTeacher ? 'mt-1 text-sm' : 'mt-0.5 text-xs'}`}>
                  {person.name}
                </p>
              </div>

              {/* Clean Equalizer */}
              <div className="mt-1.5 flex items-end gap-[3px]" style={{ height: isTeacher ? '18px' : '14px' }}>
                {[35, 60, 48, 72, ...(isTeacher ? [50] : [])].map((height, barIndex) => (
                  <span
                    key={barIndex}
                    className="w-1 rounded-full bg-cyan-400"
                    style={{
                      height: `${height}%`,
                      animation: `subtleAudio 900ms ease-in-out infinite alternate`,
                      animationDelay: `${barIndex * 150 + index * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Right Box: Meeting Flow Sequence */}
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-slate-200/40 p-4 shadow-sm backdrop-blur-md flex flex-col justify-center">
      <div className="space-y-3">
        {meetingFlow.map(({ label, helper, icon: Icon }, index) => {
          const delay = `${index * 1.2}s`; 
          
          return (
            <div key={label} className="flex items-center gap-3.5">
              {/* Glassy Auto-animating Icon */}
              <div 
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm"
                style={{
                  animation: `autoHoverIconGlass 4.8s infinite ease-in-out`,
                  animationDelay: delay
                }}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Glassy Auto-animating Card */}
              <div 
                className="min-w-0 flex-1 rounded-xl px-3.5 py-2.5"
                style={{
                  animation: `autoHoverCardGlass 4.8s infinite ease-in-out`,
                  animationDelay: delay,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {label}
                  </p>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 opacity-80"
                  />
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500 line-clamp-1">
                  {helper}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
</PremiumCard>
  );
}

function FeatureCard({ icon: Icon, title, desc }: (typeof capabilities)[number]) {
  return (
    <PremiumCard className="features-card group h-full p-5">
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
            Melanam brings meetings, LMS, AI notes, and action follow-up into one smooth workspace.
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
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Features</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">Everything in one meeting workspace.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
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
