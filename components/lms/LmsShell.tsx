'use client';

import { Sparkles } from 'lucide-react';

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
    <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-6 px-3 py-8 sm:px-5">
      <header className="border-b border-[#2a3039] pb-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#37d7ff]">
            <Sparkles className="h-3.5 w-3.5" />
            {kicker}
          </div>
          <h1 className="mt-3 max-w-4xl font-display text-2xl font-semibold text-[#f4f7fa] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a7b1bc] sm:text-base">
            {description}
          </p>
          {stats && stats.length > 0 ? (
            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-[#2a3039] bg-[#2a3039] sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-[#12151a] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7d8897]">{stat.label}</p>
                  <p className="mt-1 font-display text-xl font-semibold text-[#f4f7fa]">{stat.value}</p>
                  {stat.helper ? <p className="mt-1 text-xs text-[#8f9aa8]">{stat.helper}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </header>
      <div className="grid min-w-0 gap-5">{children}</div>
    </div>
  );
}
