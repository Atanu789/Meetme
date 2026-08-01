'use client';

import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CometCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  intensity?: 'soft' | 'strong';
}

export function CometCard({ children, className, innerClassName, intensity = 'soft' }: CometCardProps) {
  return (
    <div className={cn('relative h-full overflow-hidden rounded-xl border border-white/10 bg-[#111113]', intensity === 'strong' && 'border-[#ef233c]', className)}>
      <div className={cn('relative flex h-full flex-col text-[#f4f7fa]', innerClassName)}>{children}</div>
    </div>
  );
}
