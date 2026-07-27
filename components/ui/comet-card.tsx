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
    <div className={cn('relative h-full overflow-hidden rounded-lg border border-[#2a3039] bg-[#12151a]', intensity === 'strong' && 'border-[#37d7ff]', className)}>
      <div className={cn('relative flex h-full flex-col text-[#f4f7fa]', innerClassName)}>{children}</div>
    </div>
  );
}
