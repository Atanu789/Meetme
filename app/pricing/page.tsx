"use client";

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CreditCard,
  Gauge,
  Infinity,
  Landmark,
  LockKeyhole,
  Sparkles,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react';
import {
  BILLING_PLANS,
  CREDIT_PACKS,
  formatInr,
  getAnnualSavings,
  getPlanPrice,
  getPlanRank,
  type BillingCycle,
  type CreditPackKey,
  type PlanKey,
} from '../../lib/billing-plans';
import { GlowCard } from '../../components/ui/glow-card';
import { GradientBorderButton, GradientBorderLink } from '../../components/ui/gradient-border-button';

type Membership = {
  plan: PlanKey;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending';
  billingCycle: BillingCycle;
  includedCredits: number;
  usedCredits: number;
  extraCredits: number;
  creditBalance: number | null;
  currentPeriodEnd: string | null;
  active: boolean;
  selected: boolean;
};

const valueStats = [
  { label: 'Razorpay-ready', value: 'INR', icon: Landmark },
  { label: 'Paid gateway reserve', value: '2.36%', icon: BarChart3 },
  { label: 'Credits start from', value: 'Rs. 0.69/min', icon: Gauge },
];

const comparisonRows = [
  ['Meeting rooms', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['People who can join', '25', '150', '500'],
  ['Workspace seats', '1', '25', '100'],
  ['Max room length', '45 min', '12 hours', '24 hours'],
  ['AI summaries', 'No', 'Yes', 'Advanced'],
  ['Recording', 'No', 'Local', 'Workspace'],
  ['Livestream', 'No', 'No', 'Yes'],
  ['Admin controls', 'No', 'Basic', 'Full'],
];

function PlanPrice({ planKey, cycle }: { planKey: PlanKey; cycle: BillingCycle }) {
  const price = getPlanPrice(planKey, cycle);
  const suffix = planKey === 'enterprise' ? '' : cycle === 'annual' ? '/year' : '/month';

  return (
    <div className="flex items-end gap-2">
      <span className="font-display text-4xl font-semibold text-slate-950">{formatInr(price)}</span>
      {suffix ? <span className="pb-1 text-sm font-semibold text-slate-500">{suffix}</span> : null}
    </div>
  );
}

function planChangeBlocked(membership: Membership | null, targetPlan: PlanKey) {
  if (!membership?.active) return '';
  if (membership.plan === 'enterprise') return 'Enterprise plan changes are handled by sales or the system console.';

  const currentRank = getPlanRank(membership.plan);
  const targetRank = getPlanRank(targetPlan);
  if (targetRank >= currentRank) return '';

  if (membership.plan === 'business') {
    return 'Business cannot move to Pro or Free until the current plan expires.';
  }

  if (membership.creditBalance !== null && membership.creditBalance <= 0) return '';

  return 'Downgrade unlocks after your current quota is used or the plan expires.';
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const visiblePlans = useMemo(
    () => (membership?.active ? BILLING_PLANS.filter((plan) => plan.key !== membership.plan) : BILLING_PLANS),
    [membership?.active, membership?.plan]
  );
  const currentPlan = membership?.active ? BILLING_PLANS.find((plan) => plan.key === membership.plan) : null;

  const loadMembership = async () => {
    if (!isAuthenticated) {
      setMembership(null);
      return;
    }

    setLoadingMembership(true);
    try {
      const response = await fetch('/api/billing/subscription', { credentials: 'include' });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setMembership(body.subscription || null);
      }
    } finally {
      setLoadingMembership(false);
    }
  };

  useEffect(() => {
    void loadMembership();
  }, [isAuthenticated]);

  const requireLogin = () => {
    router.push(`/sign-in?callbackUrl=${encodeURIComponent('/pricing')}`);
  };

  const activateFreePlan = async () => {
    setBusyKey('free');
    setMessage(null);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: 'free', billingCycle: 'monthly' }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'Could not activate Free plan');
      }
      setMembership(body.subscription);
      setMessage({ type: 'success', text: 'Free plan activated. Your workspace is ready.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Could not activate Free plan' });
    } finally {
      setBusyKey('');
    }
  };

  const openCheckout = async (payload: { planKey?: PlanKey; creditPackKey?: CreditPackKey }) => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    const actionKey = payload.creditPackKey || payload.planKey || 'checkout';
    setBusyKey(actionKey);
    setMessage(null);

    try {
      const response = await fetch('/api/billing/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...payload, billingCycle: cycle }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'Checkout failed');
      }

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!key) {
        throw new Error('Missing Razorpay public key');
      }

      const checkout = new (window as any).Razorpay({
        key,
        amount: body.order.amount,
        currency: body.order.currency,
        name: 'Melanam',
        description: payload.creditPackKey ? 'Melanam credit top-up' : `Melanam ${payload.planKey} ${cycle}`,
        order_id: body.order.id,
        handler: async (payment: any) => {
          const verifyResponse = await fetch('/api/billing/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              razorpayOrderId: payment.razorpay_order_id,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            }),
          });
          const verifyBody = await verifyResponse.json().catch(() => ({}));
          if (!verifyResponse.ok) {
            setMessage({ type: 'error', text: verifyBody.error || 'Payment verification failed' });
            return;
          }
          setMembership(verifyBody.subscription);
          setMessage({ type: 'success', text: payload.creditPackKey ? 'Credits added.' : 'Plan activated.' });
        },
        prefill: {
          email: session?.user?.email || '',
        },
        theme: { color: '#0891b2' },
      });

      checkout.open();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Checkout failed' });
    } finally {
      setBusyKey('');
    }
  };

  const selectPlan = async (planKey: PlanKey) => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    const blockedReason = planChangeBlocked(membership, planKey);
    if (blockedReason) {
      setMessage({ type: 'error', text: blockedReason });
      return;
    }

    if (planKey === 'enterprise') {
      window.location.href = 'mailto:sales@melanam.com?subject=Melanam%20Enterprise%20Plan';
      return;
    }

    if (planKey === 'free') {
      await activateFreePlan();
      return;
    }

    await openCheckout({ planKey });
  };

  return (
    <div className="page-shell-wide space-y-8 pb-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="p-6 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              Melanam pricing
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
              Choose the plan that keeps every meeting moving.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Start free, upgrade when AI notes and recordings become daily work, and add credits whenever your team has a busy month.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {(['monthly', 'annual'] as BillingCycle[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setCycle(item)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      cycle === item ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item === 'monthly' ? 'Monthly' : 'Annual'}
                  </button>
                ))}
              </div>
              <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                Annual saves up to 2 months
              </span>
              {isAuthenticated ? (
                <GradientBorderLink href="/lms" variant="light">
                  Continue to LMS
                  <ArrowRight className="h-4 w-4" />
                </GradientBorderLink>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Membership status</p>
            {loadingMembership ? (
              <p className="mt-4 text-sm text-slate-300">Loading membership...</p>
            ) : membership?.active ? (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="font-display text-3xl font-semibold">{BILLING_PLANS.find((plan) => plan.key === membership.plan)?.title || membership.plan}</p>
                  <p className="mt-1 text-sm text-slate-300">Active until {membership.currentPeriodEnd ? new Date(membership.currentPeriodEnd).toLocaleDateString() : 'manual renewal'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs text-slate-300">Credits left</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{membership.creditBalance == null ? 'Custom' : Math.round(membership.creditBalance)}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs text-slate-300">Used</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{Math.round(membership.usedCredits)}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs text-slate-300">Extra</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{Math.round(membership.extraCredits)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <LockKeyhole className="h-10 w-10 text-cyan-200" />
                <p className="font-display text-3xl font-semibold">Select a plan to unlock the workspace.</p>
                <p className="text-sm leading-6 text-slate-300">
                  Free is available without payment. Pro and Business activate after Razorpay verification.
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3">
              {valueStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <Icon className="h-4 w-4 text-cyan-200" />
                    {label}
                  </span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Seats mean signed-in workspace members. People who join a live meeting are counted separately as participants.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
          message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {message.text}
        </div>
      ) : null}

      {currentPlan ? (
        <section className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50/70 p-5 shadow-[0_18px_50px_rgba(8,145,178,0.12)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Current plan</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">{currentPlan.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {currentPlan.description} Downgrades are locked while this paid plan is active, unless the Pro quota is used up.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[38rem]">
              <div className="rounded-xl bg-white p-4 ring-1 ring-cyan-500/15">
                <CalendarDays className="h-4 w-4 text-cyan-700" />
                <p className="mt-2 text-xs text-slate-500">Rooms</p>
                <p className="font-semibold text-slate-950">{currentPlan.limits.monthlyRooms}</p>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-cyan-500/15">
                <Users className="h-4 w-4 text-cyan-700" />
                <p className="mt-2 text-xs text-slate-500">Participants</p>
                <p className="font-semibold text-slate-950">{currentPlan.limits.participants}</p>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-cyan-500/15">
                <Users className="h-4 w-4 text-cyan-700" />
                <p className="mt-2 text-xs text-slate-500">Seats</p>
                <p className="font-semibold text-slate-950">{currentPlan.limits.seats}</p>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-cyan-500/15">
                <Zap className="h-4 w-4 text-cyan-700" />
                <p className="mt-2 text-xs text-slate-500">Credits left</p>
                <p className="font-semibold text-slate-950">{membership.creditBalance == null ? 'Custom' : Math.round(membership.creditBalance)}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {currentPlan ? 'Other plans' : 'Choose your plan'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">
              {currentPlan ? 'Upgrade or compare what comes next' : 'Start free or buy Pro in seconds'}
            </h2>
          </div>
          <p className="text-sm text-slate-500">All plans include unlimited meeting rooms.</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
        {visiblePlans.map((plan) => {
          const isCurrent = membership?.active && membership.plan === plan.key;
          const annualSavings = getAnnualSavings(plan.key);
          const blockedReason = planChangeBlocked(membership, plan.key);
          const disabled = Boolean(isCurrent || busyKey || blockedReason);
          return (
            <GlowCard
              key={plan.key}
              className={`flex h-full flex-col p-5 ${plan.recommended ? 'ring-2 ring-cyan-500/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                    {plan.badge}
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-slate-950">{plan.title}</h2>
                </div>
                {plan.recommended ? (
                  <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-500/20">Best value</span>
                ) : null}
              </div>

              <p className="mt-3 min-h-[3rem] text-sm leading-6 text-slate-600">{plan.description}</p>
              <div className="mt-5">
                <PlanPrice planKey={plan.key} cycle={cycle} />
                {cycle === 'annual' && annualSavings > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">Save {formatInr(annualSavings)} yearly</p>
                ) : null}
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Included</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-700" /> {plan.limits.monthlyRooms}</span>
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-cyan-700" /> {plan.limits.participants}</span>
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-cyan-700" /> {plan.limits.seats}</span>
                  <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-700" /> {plan.limits.credits}</span>
                  <span>{plan.limits.meetingMinutes}</span>
                </div>
              </div>

              <ul className="mt-5 space-y-2">
                {plan.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <GradientBorderButton
                  variant={plan.key === 'enterprise' ? 'light' : plan.recommended ? 'create' : 'join'}
                  onClick={() => selectPlan(plan.key)}
                  disabled={disabled}
                  className="w-full justify-center"
                >
                  {plan.key === 'enterprise' ? <Infinity className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  {isCurrent ? 'Current plan' : blockedReason ? 'Downgrade locked' : busyKey === plan.key ? 'Working...' : plan.key === 'free' ? 'Activate Free' : plan.key === 'enterprise' ? 'Contact Sales' : `Buy ${plan.title}`}
                </GradientBorderButton>
                {blockedReason ? (
                  <p className="mt-3 text-xs leading-5 text-amber-700">{blockedReason}</p>
                ) : null}
              </div>
            </GlowCard>
          );
        })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <GlowCard className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Plan comparison</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">What users get</h2>
            </div>
            <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center">Pro</div>
              <div className="text-center">Business</div>
            </div>
            {comparisonRows.map(([feature, free, pro, business]) => (
              <div key={feature} className="grid grid-cols-4 border-t border-slate-200 px-4 py-3 text-sm">
                <div className="font-medium text-slate-800">{feature}</div>
                <div className="text-center text-slate-500">{free}</div>
                <div className="text-center text-slate-500">{pro}</div>
                <div className="text-center text-slate-500">{business}</div>
              </div>
            ))}
          </div>
        </GlowCard>

        <GlowCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Extra credits</p>
              <h2 className="font-display text-2xl font-semibold text-slate-950">Buy only when needed</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.key} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{pack.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{pack.credits} credits</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{pack.description}</p>
                  </div>
                  <p className="font-display text-xl font-semibold text-slate-950">{formatInr(pack.amountInr)}</p>
                </div>
                <button
                  onClick={() => openCheckout({ creditPackKey: pack.key })}
                  disabled={!membership?.active || Boolean(busyKey)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  {busyKey === pack.key ? 'Opening...' : 'Buy credits'}
                </button>
              </div>
            ))}
          </div>
          {!membership?.active ? (
            <p className="mt-3 text-xs text-slate-500">Activate Free, Pro, or Business before adding credits.</p>
          ) : null}
        </GlowCard>
      </section>
    </div>
  );
}
