import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'Create Room', href: '/sign-up' },
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Documentation', href: '/documentation' },
      { label: 'Help Center', href: '/help-center' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
      <div className="mx-auto max-w-[80rem] px-3 pt-12 sm:px-5">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="font-display text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-white">Melanam</div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-white/45">
              Secure video rooms with live captions, AI meeting notes, and beautiful follow-ups.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">{section.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-slate-600 transition-colors hover:text-slate-900 dark:text-white/50 dark:hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2 lg:col-span-5">
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

        <div className="mt-8 flex flex-col border-t border-slate-200/80 py-8 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-white/35">
            &copy; 2036 Global Development Networks Ltd. All Rights Reserved.
          </p>
          <span className="mt-4 font-display text-[11px] uppercase tracking-[0.15em] text-slate-400 dark:text-white/25 sm:mt-0">
            Private by design
          </span>
        </div>
      </div>
    </footer>
  );
}
