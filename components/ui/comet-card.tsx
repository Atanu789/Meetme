'use client';

import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CometCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  intensity?: 'soft' | 'strong';
}

export function CometCard({
  children,
  className,
  innerClassName,
  intensity = 'soft',
}: CometCardProps) {
  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    event.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    event.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const glowOpacity = intensity === 'strong' ? 'opacity-100' : 'opacity-80';

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        'comet-card group relative h-full overflow-hidden rounded-[1.6rem] p-px',
        'bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(15,23,42,0.1)_34%,rgba(16,185,129,0.24))]',
        'shadow-[0_22px_60px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_rgba(8,145,178,0.2)]',
        className
      )}
      style={
        {
          '--mouse-x': '50%',
          '--mouse-y': '0%',
        } as CSSProperties
      }
    >
      <div
        className={cn(
          'pointer-events-none absolute -inset-24 rounded-[inherit]',
          'bg-[radial-gradient(240px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(34,211,238,0.24),transparent_55%)]',
          glowOpacity
        )}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span className="comet-card__tail absolute left-[-18%] top-[-28%] h-40 w-3 rotate-[35deg] rounded-full bg-[linear-gradient(180deg,transparent,rgba(34,211,238,0.95),rgba(16,185,129,0.85),transparent)] blur-[1px]" />
        <span className="comet-card__core absolute left-[-12%] top-[-18%] h-3 w-3 rounded-full bg-white shadow-[0_0_24px_rgba(34,211,238,0.95)]" />
      </div>
      <div
        className={cn(
          'relative z-10 flex h-full flex-col overflow-hidden rounded-[1.55rem] border border-white/70 bg-white/92',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl',
          innerClassName
        )}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-28 w-28 translate-x-10 translate-y-10 rounded-full bg-emerald-200/35 blur-2xl" />
        {children}
      </div>
    </div>
  );
}
