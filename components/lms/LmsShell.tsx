'use client';

import { Sparkles } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';

export function LmsShell({
  kicker,
  title,
  description,
  children,
  stats,
}: {
  kicker: string;
  title: string;
  description: string;
  children: React.ReactNode;
  stats?: Array<{ label: string; value: string | number; helper?: string }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-6 overflow-hidden px-3 py-6 sm:px-5">
      <GlowCard className="!rounded-[2rem] !border-0 !bg-transparent !p-0 !shadow-none hover:!shadow-none overflow-hidden text-white">
        <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.35),transparent_34%),radial-gradient(circle_at_78%_10%,rgba(52,211,153,0.22),transparent_30%),radial-gradient(circle_at_62%_88%,rgba(99,102,241,0.22),transparent_36%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95)_48%,rgba(8,47,73,0.92))]" />
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative z-10 rounded-[inherit] p-5 sm:p-8 lg:p-9">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
              {kicker}
            </div>
            <h1 className="mt-5 max-w-4xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {description}
            </p>
            {stats && stats.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </GlowCard>
      <div className="grid min-w-0 gap-6 overflow-hidden">{children}</div>
    </div>
  );
}
