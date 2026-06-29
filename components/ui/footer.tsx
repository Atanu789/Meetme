import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
      <div className="mx-auto max-w-[80rem] px-3 pt-12 pb-0 sm:px-5">
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="font-display text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-white">Melanam</div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-white/45">
              Secure video rooms with live captions, AI meeting notes, and beautiful follow-ups.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Product</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/sign-up" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Create Room</Link></li>
              <li><Link href="#features" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Features</Link></li>
              <li><Link href="#pricing" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Pricing</Link></li>
              <li><Link href="/" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Roadmap</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Resources</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Documentation</Link></li>
              <li><Link href="/" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Security</Link></li>
              <li><Link href="/" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Status</Link></li>
              <li><Link href="/" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">Help Center</Link></li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Get Started</h3>
            <p className="mt-4 text-sm text-slate-600 dark:text-white/45">
              Ready to transform your meetings? Create your first room today.
            </p>
            <Link href="/sign-up" className="font-display group mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-emerald-400 dark:shadow-cyan-500/20">
              Start Free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 flex flex-col border-t border-slate-200/80 pt-8 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-white/35">
            © {currentYear} Melanam. All rights reserved.
          </p>
          <div className="mt-4 flex gap-6 text-sm sm:mt-0">
            <Link href="/" className="text-slate-500 transition-colors hover:text-slate-700 dark:text-white/35 dark:hover:text-white/55">
              Privacy
            </Link>
            <Link href="/" className="text-slate-500 transition-colors hover:text-slate-700 dark:text-white/35 dark:hover:text-white/55">
              Terms
            </Link>
            <span className="font-display uppercase tracking-[0.15em] text-[11px] text-slate-400 dark:text-white/25">
              Private by design
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
