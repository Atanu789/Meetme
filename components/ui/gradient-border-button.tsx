'use client';

import Link, { LinkProps } from 'next/link';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseWrap =
  'group relative inline-flex items-center justify-center rounded-full p-[1px] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950';

const innerBase =
  'relative flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200';

const wrapVariants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 shadow-[0_14px_30px_rgba(14,165,233,0.16)] hover:shadow-[0_18px_36px_rgba(14,165,233,0.2)]',
  light: 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]',
  create: 'bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400 shadow-[0_20px_48px_rgba(14,165,233,0.24)] hover:shadow-[0_28px_56px_rgba(14,165,233,0.3)]',
  join: 'bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 shadow-[0_20px_48px_rgba(249,115,22,0.24)] hover:shadow-[0_28px_56px_rgba(249,115,22,0.3)]',
};

const variants: Record<'dark' | 'light' | 'create' | 'join', string> = {
  dark: 'bg-slate-950 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] group-hover:bg-slate-900',
  light: 'bg-white/92 text-slate-950 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.1)] group-hover:bg-white',
  create: 'bg-[linear-gradient(135deg,#06283d_0%,#0369a1_48%,#059669_100%)] px-7 py-3.5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] group-hover:brightness-[1.05]',
  join: 'bg-[linear-gradient(135deg,#422006_0%,#c2410c_50%,#e11d48_100%)] px-7 py-3.5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] group-hover:brightness-[1.05]',
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
