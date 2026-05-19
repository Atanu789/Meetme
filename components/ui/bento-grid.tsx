'use client';

import type { ReactNode } from 'react';

interface BentoGridProps {
  className?: string;
  children: ReactNode;
}

export function BentoGrid({ className = '', children }: BentoGridProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function BentoCard({
  title,
  description,
  eyebrow,
  icon,
  className = '',
  children,
  actions,
}: BentoCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-5 shadow-[0_20px_56px_rgba(15,23,42,0.08)] backdrop-blur transition-shadow duration-200 hover:shadow-[0_24px_64px_rgba(15,23,42,0.1)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="relative z-10 flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            <h3 className="mt-2 font-display text-lg font-semibold text-slate-950 sm:text-xl">
              {title}
            </h3>
          </div>
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              {icon}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-slate-600">{description}</p>
        ) : null}
        {children}
        {actions ? (
          <div className="mt-auto flex flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
