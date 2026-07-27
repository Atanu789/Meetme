'use client';

import Link, { LinkProps } from 'next/link';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseWrap =
  'inline-flex items-center justify-center rounded-md border p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300';

const innerBase =
  'relative flex h-full w-full items-center justify-center gap-2 rounded-[5px] px-4 py-2 text-sm font-semibold';

const wrapVariants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'border-[#343c47] bg-[#272d36]',
  light: 'border-[#343c47] bg-[#272d36]',
  create: 'border-[#53ddff] bg-[#37d7ff]',
  join: 'border-[#53ddff] bg-[#37d7ff]',
};

const variants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'bg-[#181c22] text-[#f4f7fa] hover:bg-[#20252d]',
  light: 'bg-[#181c22] text-[#f4f7fa] hover:bg-[#20252d]',
  create: 'bg-[#37d7ff] px-5 py-2.5 text-[#071015] hover:bg-[#58defe]',
  join: 'bg-[#15392b] px-5 py-2.5 text-[#c0f5d9] hover:bg-[#1d4c38]',
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
