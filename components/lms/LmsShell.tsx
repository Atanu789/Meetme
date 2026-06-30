'use client';

import { Activity, ArrowUpRight, Gauge, Sparkles } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';

function getStatNumber(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

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
  const maxStatValue = Math.max(...(stats || []).map((stat) => getStatNumber(stat.value)), 1);

  return (
    <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-6 overflow-hidden px-3 py-6 sm:px-5">
      <GlowCard className="overflow-hidden rounded-[2rem] border-white/20 bg-slate-950 p-0 text-white shadow-[0_34px_110px_rgba(2,6,23,0.28)]">
        <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.35),transparent_34%),radial-gradient(circle_at_78%_10%,rgba(52,211,153,0.22),transparent_30%),radial-gradient(circle_at_62%_88%,rgba(99,102,241,0.22),transparent_36%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95)_48%,rgba(8,47,73,0.92))]" />
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative z-10 grid gap-8 rounded-[inherit] p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-9">
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
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Live class ready', 'Create and launch meetings from role dashboards.'],
                ['Course intelligence', 'Assignments, recordings, and resources stay in one lane.'],
                ['Premium focus', 'Clean cards, soft motion, and no horizontal drift.'],
              ].map(([label, helper]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                    {label}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-300">{helper}</p>
                </div>
              ))}
            </div>
          </div>

          {stats && stats.length > 0 ? (
            <div className="min-w-0 rounded-[2rem] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">Dashboard Signal</p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-white">Operational pulse</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                  <Gauge className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.35rem] border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                      <p className="mt-2 font-display text-3xl font-semibold text-white">{stat.value}</p>
                    </div>
                    <Activity className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300"
                      style={{ width: `${Math.max(12, Math.min(100, (getStatNumber(stat.value) / maxStatValue) * 100))}%` }}
                    />
                  </div>
                  {stat.helper ? <p className="mt-2 text-xs leading-5 text-slate-300">{stat.helper}</p> : null}
                </div>
              ))}
              </div>
              <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Flow health</span>
                  <span className="text-emerald-200">Smooth</span>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {[42, 58, 76, 62, 88, 72, 94].map((height, index) => (
                    <div key={index} className="flex h-20 items-end rounded-full bg-white/6 p-1">
                      <div
                        className="w-full rounded-full bg-gradient-to-t from-emerald-300 to-cyan-200"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </GlowCard>
      <div className="grid min-w-0 gap-6 overflow-hidden">{children}</div>
    </div>
  );
}
