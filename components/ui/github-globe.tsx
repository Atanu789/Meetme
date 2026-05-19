'use client';

import { motion } from 'motion/react';

interface GithubGlobeProps {
  className?: string;
}

const orbitDots = [
  { top: '18%', left: '28%', color: 'bg-cyan-400', delay: 0 },
  { top: '62%', left: '22%', color: 'bg-emerald-400', delay: 0.2 },
  { top: '30%', left: '68%', color: 'bg-amber-400', delay: 0.4 },
  { top: '66%', left: '70%', color: 'bg-sky-400', delay: 0.6 },
  { top: '48%', left: '50%', color: 'bg-indigo-400', delay: 0.8 },
];

export function GithubGlobe({ className = '' }: GithubGlobeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      <div className="relative mx-auto h-[360px] w-[360px] sm:h-[440px] sm:w-[440px]">
        <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(56,189,248,0.28),transparent_42%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.2),transparent_38%),radial-gradient(circle_at_50%_50%,rgba(15,23,42,0.08),transparent_70%)] blur-3xl" />

        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.98),rgba(226,232,240,0.78)_44%,rgba(148,163,184,0.35)_68%,rgba(15,23,42,0.12)_100%)] shadow-[0_40px_110px_rgba(15,23,42,0.22)]" />
          <div className="absolute inset-8 rounded-full border border-white/60 bg-[conic-gradient(from_135deg,rgba(14,165,233,0.14),rgba(255,255,255,0.08),rgba(16,185,129,0.14),rgba(255,255,255,0.08),rgba(14,165,233,0.14))]" />

          <svg viewBox="0 0 100 100" className="absolute inset-[10%] h-[80%] w-[80%] text-slate-600/40">
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.7" />
            <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="0.55" />
            <ellipse cx="50" cy="50" rx="38" ry="20" fill="none" stroke="currentColor" strokeWidth="0.55" />
            <ellipse cx="50" cy="50" rx="38" ry="28" fill="none" stroke="currentColor" strokeWidth="0.55" />
            <ellipse cx="50" cy="50" rx="28" ry="38" fill="none" stroke="currentColor" strokeWidth="0.55" transform="rotate(18 50 50)" />
            <ellipse cx="50" cy="50" rx="28" ry="38" fill="none" stroke="currentColor" strokeWidth="0.55" transform="rotate(-18 50 50)" />
            <ellipse cx="50" cy="50" rx="16" ry="38" fill="none" stroke="currentColor" strokeWidth="0.55" transform="rotate(36 50 50)" />
            <ellipse cx="50" cy="50" rx="16" ry="38" fill="none" stroke="currentColor" strokeWidth="0.55" transform="rotate(-36 50 50)" />
          </svg>

          <motion.div
            className="absolute inset-10 rounded-full border border-cyan-300/45"
            animate={{ rotate: -360 }}
            transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-[18%] rounded-full border border-sky-300/35"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-[28%] rounded-full border border-emerald-300/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            className="absolute left-1/2 top-[10%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)]"
            animate={{ scale: [1, 1.6, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          <motion.div
            className="absolute left-1/2 bottom-[12%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-900/35"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.4 }}
          />
        </motion.div>

        {orbitDots.map((dot) => (
          <motion.div
            key={`${dot.top}-${dot.left}`}
            className={`absolute h-2.5 w-2.5 rounded-full ${dot.color} shadow-[0_0_14px_rgba(14,165,233,0.75)]`}
            style={{ top: dot.top, left: dot.left }}
            animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: dot.delay }}
          />
        ))}

        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_38%,transparent_44%,rgba(15,23,42,0.04)_76%,rgba(15,23,42,0.16)_100%)]" />
        <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
          GitHub globe
        </div>
      </div>
    </motion.div>
  );
}
