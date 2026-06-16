"use client";

import Script from 'next/script';
import { useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { BILLING_PLANS, getPlanPrice, type BillingCycle, type PlanKey } from '../../lib/billing-plans';
import { GlowCard } from '../../components/ui/glow-card';
import { GradientBorderButton, GradientBorderLink } from '../../components/ui/gradient-border-button';

const competitiveNotes = [
  'Melanam bundles conferencing + AI + tasks + analytics in one product.',
  'Razorpay checkout supports Indian pricing out of the box.',
  'Free plan stays generous enough for adoption, but capped for cost control.',
];

function formatPrice(value: number | null, currency: 'usd' | 'inr') {
  if (value == null) return 'Custom';
  return currency === 'usd' ? `$${value}` : `₹${value}`;
}

function PricePill({ price, label, muted = false }: { price: string; label: string; muted?: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${muted ? 'border-slate-200 bg-slate-50' : 'border-cyan-200 bg-cyan-50'}`}>
      <div className={`text-2xl font-display font-semibold ${muted ? 'text-slate-900' : 'text-cyan-700'}`}>{price}</div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
    </div>
  );
}

function BillingCard({ planKey, cycle, currency }: { planKey: PlanKey; cycle: BillingCycle; currency: 'usd' | 'inr' }) {
  const plan = BILLING_PLANS.find((item) => item.key === planKey)!;
  const currentPrice = getPlanPrice(planKey, cycle, currency);
  const annualMonthlyEquivalent = cycle === 'annual' && currentPrice != null ? Math.round((currentPrice / 12) * 100) / 100 : null;

  const handleCheckout = async () => {
    if (planKey === 'enterprise') {
      window.location.href = 'mailto:sales@melanam.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    const resp = await fetch('/api/billing/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey, billingCycle: cycle }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      alert(data.error || 'Checkout failed');
      return;
    }

    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      alert('Missing Razorpay public key');
      return;
    }

    const options = {
      key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'Melanam',
      description: `${plan.title} ${cycle} subscription`,
      order_id: data.order.id,
      handler: async (response: any) => {
        await fetch('/api/billing/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        window.location.reload();
      },
      theme: { color: '#0891b2' },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  return (
    <GlowCard className={`flex h-full flex-col p-6 ${planKey === 'business' ? 'ring-2 ring-cyan-500/20' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-semibold text-slate-950">{plan.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
        </div>
        {planKey === 'business' ? (
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Best value</span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <PricePill price={formatPrice(currentPrice, currency)} label={cycle === 'monthly' ? `${currency.toUpperCase()} / month` : `${currency.toUpperCase()} / year`} />
        <PricePill price={formatPrice(currentPrice, currency)} label="Per user" muted />
      </div>

      {annualMonthlyEquivalent != null ? (
        <p className="mt-3 text-xs text-slate-500">Equivalent to about {formatPrice(annualMonthlyEquivalent, currency)} per month on annual billing.</p>
      ) : null}

      <ul className="mt-5 space-y-2 text-sm text-slate-600">
        {plan.highlights.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Included limits</p>
        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <div>Meeting: {plan.limits.meetingMinutes}</div>
          <div>AI: {plan.limits.aiMinutes}</div>
          <div>Captions: {plan.limits.captions}</div>
          <div>Summaries: {plan.limits.summaries}</div>
          <div>Recordings: {plan.limits.recordings}</div>
          <div>Storage: {plan.limits.storage}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <GradientBorderButton variant={planKey === 'enterprise' ? 'light' : 'create'} onClick={handleCheckout}>
          <CreditCard className="h-4 w-4" />
          {planKey === 'enterprise' ? 'Contact Sales' : 'Checkout with Razorpay'}
        </GradientBorderButton>
        <GradientBorderLink href="/dashboard" variant="light">
          Open dashboard
          <ArrowRight className="h-4 w-4" />
        </GradientBorderLink>
      </div>
    </GlowCard>
  );
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currency, setCurrency] = useState<'usd' | 'inr'>('usd');
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Require authentication for checkout/pricing details. Redirect to sign-in when unauthenticated.
    if (status === 'unauthenticated') {
      const currentUrl = `/pricing`;
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [status, router]);

  const pricePlans = useMemo(() => BILLING_PLANS.filter((plan) => plan.key !== 'enterprise'), []);

  if (status === 'loading') return null;

  return (
    <div className="page-shell-wide space-y-10 pb-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.18),transparent_45%),radial-gradient(circle_at_86%_24%,rgba(16,185,129,0.14),transparent_42%),radial-gradient(circle_at_68%_82%,rgba(251,191,36,0.16),transparent_46%)]" />
        <div className="relative z-10 space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              Pricing designed for growth + margin
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Simple pricing for meetings, AI, and the work that follows.
            </h1>
            <p className="text-base text-slate-600">
              Melanam combines conferencing, captions, summaries, tasks, polls, and analytics into one bundle.
              Use Razorpay for Indian checkout and keep the plans easy to understand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCycle('monthly')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${cycle === 'monthly' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${cycle === 'annual' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
              Annual
            </button>
            <div className="ml-0 flex items-center gap-2 sm:ml-2">
              <button onClick={() => setCurrency('usd')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${currency === 'usd' ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                USD
              </button>
              <button onClick={() => setCurrency('inr')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${currency === 'inr' ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                INR
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {competitiveNotes.map((item) => (
              <GlowCard key={item} className="p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-600" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {pricePlans.map((plan) => (
          <BillingCard key={plan.key} planKey={plan.key} cycle={cycle} currency={currency} />
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <GlowCard className="p-6">
          <h2 className="font-display text-2xl font-semibold text-slate-950">What each plan unlocks</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center">Pro</div>
              <div className="text-center">Business</div>
            </div>
            {[
              ['Recording workspace', 'Basic', 'Enhanced', 'Full'],
              ['Tasks', 'Limited', 'Yes', 'Unlimited'],
              ['Polls', 'Limited', 'Yes', 'Unlimited'],
              ['Participation analytics', 'Basic', '30 days', '365 days'],
              ['Livestreaming', 'No', 'Yes', 'Yes + custom'],
              ['Admin controls', 'No', 'No', 'Yes'],
            ].map(([feature, free, pro, business]) => (
              <div key={feature} className="grid grid-cols-4 border-t border-slate-200 px-4 py-3 text-sm">
                <div className="font-medium text-slate-700">{feature}</div>
                <div className="text-center text-slate-500">{free}</div>
                <div className="text-center text-slate-500">{pro}</div>
                <div className="text-center text-slate-500">{business}</div>
              </div>
            ))}
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <h2 className="font-display text-2xl font-semibold text-slate-950">Enterprise</h2>
          <p className="mt-2 text-sm text-slate-600">
            Custom deployment, SSO, audit logs, retention policy control, white-labeling, private hosting, and dedicated support.
          </p>
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Best for</p>
            <p className="mt-2 text-sm text-slate-600">Large teams that need security, compliance, and custom billing.</p>
          </div>
          <div className="mt-5">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              Start free first
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </GlowCard>
      </section>
    </div>
  );
}
