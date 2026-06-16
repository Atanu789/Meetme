"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

type RoleType = 'user' | 'enterprise_admin' | 'admin';

export default function Page() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleType>('user');
  
  // Enterprise fields
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage({ text: 'Please enter an email address.', type: 'error' });
      return;
    }

    if (role === 'enterprise_admin' && !companyName.trim()) {
      setMessage({ text: 'Please enter your company/organization name.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Step 1: Pre-register the user & organization metadata
      const regResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          companyName: role === 'enterprise_admin' ? companyName.trim() : undefined,
          companyDomain: role === 'enterprise_admin' && companyDomain.trim() ? companyDomain.trim() : undefined,
        }),
      });

      const regData = await regResponse.json();

      if (!regResponse.ok) {
        throw new Error(regData.error || 'Failed to complete registration pre-check.');
      }

      // Step 2: Trigger the standard NextAuth magic link login flow
      const result = await signIn('email', {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Failed to send login link. Please check SMTP settings.');
      } else {
        setMessage({
          text: 'Registration successful! A secure magic link was sent. Check your inbox.',
          type: 'success',
        });
      }
    } catch (error: any) {
      setMessage({
        text: error.message || 'An error occurred during registration. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <div className="grid w-full gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center max-w-6xl">
        
        {/* Left column hero text */}
        <div className="space-y-4 sm:space-y-5">
          <p className="section-kicker">Get started today</p>
          <h1 className="section-title font-display text-3xl font-semibold text-slate-950 sm:text-5xl">
            Create your custom workspace.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Whether hosting personal calls, setting up a corporate SSO portal, or managing a system console, get fully tailored features automatically.
          </p>
        </div>

        {/* Right column signup card */}
        <div className="surface-strong rounded-[2.5rem] p-2.5 sm:p-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-md sm:p-8 space-y-6">
            
            <div>
              <h2 className="text-xl font-bold text-slate-900">Sign Up</h2>
              <p className="text-xs text-slate-500 mt-1">Select account type and get your login link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Account Type Selector Cards */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Select Account Type
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  
                  {/* User Account */}
                  <div
                    onClick={() => setRole('user')}
                    className={`cursor-pointer rounded-2xl border p-4 transition flex flex-col justify-between ${
                      role === 'user'
                        ? 'border-cyan-500 bg-cyan-50/40 shadow-sm ring-1 ring-cyan-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-xl">👤</span>
                      <h4 className="mt-2 font-bold text-sm text-slate-900">Personal</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-4">
                      Simple private video calls & text chats.
                    </p>
                  </div>

                  {/* Enterprise Account */}
                  <div
                    onClick={() => setRole('enterprise_admin')}
                    className={`cursor-pointer rounded-2xl border p-4 transition flex flex-col justify-between ${
                      role === 'enterprise_admin'
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-xl">🏢</span>
                      <h4 className="mt-2 font-bold text-sm text-slate-900">Enterprise</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-4">
                      Central policies, SSO, and member roster.
                    </p>
                  </div>

                  {/* System Admin */}
                  <div
                    onClick={() => setRole('admin')}
                    className={`cursor-pointer rounded-2xl border p-4 transition flex flex-col justify-between ${
                      role === 'admin'
                        ? 'border-violet-500 bg-violet-50/40 shadow-sm ring-1 ring-violet-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-xl">🛡️</span>
                      <h4 className="mt-2 font-bold text-sm text-slate-900">Sys Admin</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-4">
                      Super console to monitor rooms & users.
                    </p>
                  </div>

                </div>
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input-modern w-full"
                />
              </div>

              {/* Conditional Enterprise Fields */}
              {role === 'enterprise_admin' && (
                <div className="space-y-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/10 p-4 animate-fadeIn">
                  <h4 className="font-semibold text-emerald-800 text-xs uppercase tracking-wider">
                    Company Configuration
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="companyName" className="block text-xs text-slate-600 font-medium">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="input-modern w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="companyDomain" className="block text-xs text-slate-600 font-medium">
                      Company Domain (Optional)
                    </label>
                    <input
                      id="companyDomain"
                      type="text"
                      value={companyDomain}
                      onChange={(event) => setCompanyDomain(event.target.value)}
                      placeholder="e.g. acme.com"
                      className="input-modern w-full"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Enforces auto-joining for new accounts matching this domain.
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`button-primary w-full justify-center py-3 text-sm sm:text-base font-semibold flex items-center gap-2 ${
                  role === 'enterprise_admin'
                    ? 'from-emerald-500 to-teal-500 shadow-emerald-500/20'
                    : role === 'admin'
                    ? 'from-violet-500 to-fuchsia-500 shadow-violet-500/20'
                    : 'from-cyan-500 to-blue-500 shadow-cyan-500/20'
                }`}
              >
                {loading ? 'Processing...' : 'Send Magic Link'}
              </button>

            </form>

            {/* Notification messages */}
            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium border ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}
              >
                {message.text}
              </div>
            )}

            <p className="text-center text-xs text-slate-500">
              Already have access?{' '}
              <Link href="/sign-in" className="font-semibold text-slate-900 underline">
                Sign in here
              </Link>
              .
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
