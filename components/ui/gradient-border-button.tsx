'use client';

import Link, { LinkProps } from 'next/link';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseWrap =
  'inline-flex items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300';

const innerBase =
  'relative flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold';

const wrapVariants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'bg-[#272d36]',
  light: 'bg-[#272d36]',
  create: 'bg-[#37d7ff]',
  join: 'bg-[#f2b84b]',
};

const variants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'bg-[#181c22] text-[#f4f7fa] hover:bg-[#20252d]',
  light: 'bg-[#181c22] text-[#f4f7fa] hover:bg-[#20252d]',
  create: 'bg-[#0f667d] px-5 py-2.5 text-white hover:bg-[#147c97]',
  join: 'bg-[#7c5210] px-5 py-2.5 text-white hover:bg-[#976614]',
};

interface GradientBorderButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'dark' | 'light' | 'create' | 'join';
}

export const GradientBorderButton = forwardRef<HTMLButtonElement, GradientBorderButtonProps>(
  ({ className = '', variant = 'dark', children, ...props }, ref) => {
    return (
      <button ref={ref} className={`${baseWrap} ${wrapVariants[variant]} ${className}`} {...props}>
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
    <Link className={`${baseWrap} ${wrapVariants[variant]} ${className}`} {...props}>
      <span className={`${innerBase} ${variants[variant]}`}>{children}</span>
    </Link>
  );
}
