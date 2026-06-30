'use client';

interface GlowCardProps {
  className?: string;
  children: React.ReactNode;
}

export function GlowCard({ className = '', children }: GlowCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.1)] backdrop-blur transition-shadow duration-200 hover:shadow-[0_28px_72px_rgba(15,23,42,0.12)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/70 to-transparent" />
      <div className="relative z-10 rounded-[inherit]">{children}</div>
    </div>
  );
}
