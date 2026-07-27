'use client';

interface GlowCardProps {
  className?: string;
  children: React.ReactNode;
}

export function GlowCard({ className = '', children }: GlowCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-[#2a3039] bg-[#12151a] p-5 text-[#f4f7fa] ${className}`}
    >
      <div className="relative z-10 rounded-[inherit]">{children}</div>
    </div>
  );
}
