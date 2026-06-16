'use client';

import { useEffect, useState } from 'react';

type Subscription = {
  _id: string;
  userEmail: string;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending';
  billingCycle: 'monthly' | 'annual';
  amount: number;
  currency: 'INR' | 'USD';
  cancelAtPeriodEnd: boolean;
  notes?: string;
  updatedAt: string;
};

export default function AdminSubscriptionTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.status === 403) {
        // not authorized as admin - redirect to admin login
        window.location.href = '/admin/login';
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load subscriptions');
      }
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSubscriptions();
  }, []);

  const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>) => {
    setSavingId(subscriptionId);
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, ...updates }),
      });
      if (response.status === 403) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }
      setSubscriptions((prev) => prev.map((item) => (item._id === subscriptionId ? data.subscription : item)));
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription');
    } finally {
      setSavingId(null);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Cancel this subscription?')) return;
    setSavingId(subscriptionId);
    try {
      const response = await fetch(`/api/admin/subscriptions?subscriptionId=${encodeURIComponent(subscriptionId)}`, {
        method: 'DELETE',
      });
      if (response.status === 403) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      setSubscriptions((prev) => prev.map((item) => (item._id === subscriptionId ? data.subscription : item)));
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading subscriptions...</div>;
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  if (!subscriptions.length) {
    return <div className="text-sm text-slate-500">No subscriptions found yet.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-800 font-semibold">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Plan</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Billing</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Cancel</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subscriptions.map((subscription) => (
            <tr key={subscription._id} className="hover:bg-slate-50/50 transition">
              <td className="px-6 py-4 font-medium text-slate-900">{subscription.userEmail}</td>
              <td className="px-6 py-4">
                <select
                  value={subscription.plan}
                  onChange={(e) => updateSubscription(subscription._id, { plan: e.target.value as any })}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold"
                  disabled={savingId === subscription._id}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <select
                  value={subscription.status}
                  onChange={(e) => updateSubscription(subscription._id, { status: e.target.value as any })}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold"
                  disabled={savingId === subscription._id}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <select
                  value={subscription.billingCycle}
                  onChange={(e) => updateSubscription(subscription._id, { billingCycle: e.target.value as any })}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold"
                  disabled={savingId === subscription._id}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <input
                  type="number"
                  value={subscription.amount}
                  onChange={(e) => updateSubscription(subscription._id, { amount: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                  disabled={savingId === subscription._id}
                />
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">{subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4 text-right">
                <button
                  disabled={savingId === subscription._id}
                  onClick={() => cancelSubscription(subscription._id)}
                  className="text-red-500 hover:text-red-700 font-semibold text-xs disabled:opacity-50 transition"
                >
                  {savingId === subscription._id ? 'Saving...' : 'Cancel'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
