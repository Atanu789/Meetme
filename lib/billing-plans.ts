export type BillingCycle = 'monthly' | 'annual';
export type PlanKey = 'free' | 'pro' | 'business' | 'enterprise';

export type BillingPlan = {
  key: PlanKey;
  title: string;
  monthlyUsd: number | null;
  annualUsd: number | null;
  monthlyInr: number | null;
  annualInr: number | null;
  description: string;
  highlights: string[];
  limits: {
    meetingMinutes: string;
    aiMinutes: string;
    captions: string;
    summaries: string;
    recordings: string;
    storage: string;
    fileSharing: string;
    livestreams: string;
    whiteboards: string;
    tasks: string;
    polls: string;
    analytics: string;
  };
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    key: 'free',
    title: 'Free',
    monthlyUsd: 0,
    annualUsd: 0,
    monthlyInr: 0,
    annualInr: 0,
    description: 'Start meetings and test the core workspace.',
    highlights: ['HD meetings', 'Chat', 'Basic file share', 'Light captions'],
    limits: {
      meetingMinutes: '45 min / meeting',
      aiMinutes: '60 min / month',
      captions: '60 min / month',
      summaries: '2 / month',
      recordings: '2 sessions / month',
      storage: '2 GB',
      fileSharing: '500 MB / month',
      livestreams: 'None',
      whiteboards: '1 board / meeting',
      tasks: '25 active tasks',
      polls: '3 / month',
      analytics: 'Basic only',
    },
  },
  {
    key: 'pro',
    title: 'Pro',
    monthlyUsd: 19,
    annualUsd: 190,
    monthlyInr: 1599,
    annualInr: 15990,
    description: 'Best for solo founders and small teams.',
    highlights: ['Full AI notes', 'Transcripts', 'Tasks', 'Participation analytics'],
    limits: {
      meetingMinutes: '12 hours / meeting',
      aiMinutes: '20 hours / month',
      captions: '20 hours / month',
      summaries: '50 / month',
      recordings: '20 hours / month',
      storage: '50 GB',
      fileSharing: '10 GB / month',
      livestreams: '2 / month',
      whiteboards: 'Unlimited',
      tasks: '500 active tasks',
      polls: '50 / month',
      analytics: '30-day retention',
    },
  },
  {
    key: 'business',
    title: 'Business',
    monthlyUsd: 29,
    annualUsd: 290,
    monthlyInr: 2499,
    annualInr: 24990,
    description: 'For teams that need control, scale, and visibility.',
    highlights: ['Advanced analytics', 'Recording workspace', 'Unlimited polls', 'Admin controls'],
    limits: {
      meetingMinutes: '24 hours / meeting',
      aiMinutes: '60 hours / month',
      captions: '60 hours / month',
      summaries: '200 / month',
      recordings: '100 hours / month',
      storage: '250 GB',
      fileSharing: '100 GB / month',
      livestreams: '20 / month',
      whiteboards: 'Unlimited + templates',
      tasks: 'Unlimited',
      polls: 'Unlimited',
      analytics: '365-day retention',
    },
  },
  {
    key: 'enterprise',
    title: 'Enterprise',
    monthlyUsd: null,
    annualUsd: null,
    monthlyInr: null,
    annualInr: null,
    description: 'Custom deployment, compliance, and support.',
    highlights: ['SSO/SAML', 'Audit logs', 'Data residency', 'Dedicated support'],
    limits: {
      meetingMinutes: 'Custom',
      aiMinutes: 'Custom',
      captions: 'Custom',
      summaries: 'Custom',
      recordings: 'Custom',
      storage: 'Custom',
      fileSharing: 'Custom',
      livestreams: 'Custom',
      whiteboards: 'Custom',
      tasks: 'Custom',
      polls: 'Custom',
      analytics: 'Custom',
    },
  },
];

export const BILLING_PLAN_MAP = Object.fromEntries(BILLING_PLANS.map((plan) => [plan.key, plan])) as Record<PlanKey, BillingPlan>;

export function getPlanPrice(planKey: PlanKey, cycle: BillingCycle, currency: 'usd' | 'inr') {
  const plan = BILLING_PLAN_MAP[planKey];
  if (!plan) return null;
  if (currency === 'usd') {
    return cycle === 'annual' ? plan.annualUsd : plan.monthlyUsd;
  }
  return cycle === 'annual' ? plan.annualInr : plan.monthlyInr;
}
