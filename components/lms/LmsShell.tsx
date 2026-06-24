'use client';

import { GlowCard } from '@/components/ui/glow-card';
import { SectionHeading } from '@/components/ui/section-heading';

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <GlowCard className="overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.16),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.96))]" />
        <div className="relative z-10 space-y-8 p-6 sm:p-8">
          <SectionHeading kicker={kicker} title={title} description={description} />
          {stats && stats.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">{stat.label}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-white">{stat.value}</p>
                  {stat.helper ? <p className="mt-1 text-sm text-slate-300">{stat.helper}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </GlowCard>
      <div className="grid gap-6">{children}</div>
    </div>
  );
}
