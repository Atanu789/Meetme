import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  ctaHref?: string;
  ctaLabel?: string;
};

export function InfoPage({ eyebrow, title, description, sections, ctaHref = '/lms', ctaLabel = 'Open workspace' }: InfoPageProps) {
  return (
    <div className="page-shell-wide pb-16">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
        <div className="mt-8">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_42px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-5 shadow-sm backdrop-blur">
            <h2 className="font-display text-xl font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
