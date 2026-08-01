'use client';

import Link, { LinkProps } from 'next/link';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseWrap =
  'inline-flex items-center justify-center rounded-full border p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef233c]';

const innerBase =
  'relative flex h-full w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold';

const wrapVariants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'border-white/10 bg-white/[0.03]',
  light: 'border-white/10 bg-white/[0.03]',
  create: 'border-[#ef233c]/70 bg-[#ef233c]',
  join: 'border-[#ef233c]/70 bg-[#ef233c]',
};

const variants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'bg-[#18181b] text-[#f4f4f5] hover:bg-[#27272a]',
  light: 'bg-[#18181b] text-[#f4f4f5] hover:bg-[#27272a]',
  create: 'bg-[#ef233c] px-5 py-2.5 text-white hover:bg-[#ff4056]',
  join: 'bg-[#ef233c] px-5 py-2.5 text-white hover:bg-[#ff4056]',
};

interface GradientBorderButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'dark' | 'light' | 'create' | 'join';
}

export const GradientBorderButton = forwardRef<HTMLButtonElement, GradientBorderButtonProps>(
  ({ className = '', variant = 'dark', children, ...props }, ref) => {
    return (
      <button ref={ref} className={`noir-shimmer-button ${baseWrap} ${wrapVariants[variant]} ${className}`} {...props}>
        <span className={`${innerBase} ${variants[variant]}`}>{children}</span>
      </button>
    );
  }
);

GradientBorderButton.displayName = 'GradientBorderButton';

interface GradientBorderLinkProps extends LinkProps {
  className?: string;
  variant?: 'dark' | 'light' | 'create' | 'join';
  children: ReactNode;
}

export function GradientBorderLink({
  className = '',
  variant = 'dark',
  children,
  ...props
}: GradientBorderLinkProps) {
  return (
    <Link className={`noir-shimmer-button ${baseWrap} ${wrapVariants[variant]} ${className}`} {...props}>
      <span className={`${innerBase} ${variants[variant]}`}>{children}</span>
    </Link>
  );
}
