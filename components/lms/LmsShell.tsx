'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, CreditCard, GraduationCap, Sparkles, Video } from 'lucide-react';

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
  const isInstructor = kicker.toLowerCase().includes('instructor');
  const primaryRoute = isInstructor ? '/lms/instructor' : '/lms/student';
  const workspaceLabel = isInstructor ? 'Instructor workspace' : 'Student workspace';
  const navigation = [
    { href: primaryRoute, label: isInstructor ? 'Course management' : 'My learning', icon: GraduationCap },
    { href: '/lms', label: 'Live sessions', icon: Video },
    ...(isInstructor ? [{ href: '/studio', label: 'Course Builder', icon: BookOpen }] : []),
    { href: '/pricing', label: 'Membership', icon: CreditCard },
  ];

  return (
    <div className="lms-workspace mx-auto grid w-full max-w-[90rem] gap-6 px-3 py-6 sm:px-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-8">
      <aside className="lms-sidebar hidden lg:flex">
        <div className="lms-sidebar__brand">
          <span className="font-display text-sm font-semibold text-[#f4f7fa]">Melanam</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7d8897]">{workspaceLabel}</span>
        </div>
        <nav className="lms-sidebar__nav" aria-label="Workspace navigation">
          {navigation.map(({ href, label, icon: Icon }, index) => (
            <Link key={href} href={href} className={`lms-sidebar__link ${index === 0 ? 'lms-sidebar__link--active' : ''}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="lms-sidebar__footer">
          <CalendarDays className="h-4 w-4 text-[#37d7ff]" />
          <span>Sessions and course work stay connected.</span>
        </div>
      </aside>

      <div className="min-w-0">
        <nav className="lms-mobile-nav mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Workspace navigation">
          {navigation.map(({ href, label, icon: Icon }, index) => (
            <Link key={href} href={href} className={`lms-mobile-nav__link ${index === 0 ? 'lms-mobile-nav__link--active' : ''}`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <header className="lms-shell-header relative overflow-hidden border-b border-[#2a3039] pb-6">
          <div className="min-w-0">
            <div className="lms-shell-eyebrow inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#37d7ff]">
              <Sparkles className="h-3.5 w-3.5" />
              {kicker}
            </div>
            <h1 className="lms-shell-title mt-3 max-w-4xl font-display text-[28px] font-semibold leading-tight text-[#f4f7fa] sm:text-[34px]">
              {title}
            </h1>
            <p className="lms-shell-description mt-3 max-w-2xl text-sm leading-6 text-[#a7b1bc] sm:text-[15px]">
              {description}
            </p>
            {stats && stats.length > 0 ? (
              <div className="lms-shell-stats mt-6 grid gap-px overflow-hidden rounded-lg border border-[#2a3039] bg-[#2a3039] sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="lms-shell-stat bg-[#12151a] px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7d8897]">{stat.label}</p>
                    <p className="mt-1 text-[24px] font-semibold leading-none text-[#f4f7fa]">{stat.value}</p>
                    {stat.helper ? <p className="mt-2 text-[11px] leading-4 text-[#8f9aa8]">{stat.helper}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </header>
        <main className="lms-shell-body grid min-w-0 gap-5 pt-6">{children}</main>
      </div>
    </div>
  );
}
