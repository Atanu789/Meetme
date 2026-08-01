"use client";

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { AuthHelpButton } from '../../auth-help-button';

export default function Page() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const callbackUrl = '/';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter an email address.');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await signIn('email', {
      email,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setMessage('No account was found for this email. Please sign up first, then sign in again.');
    } else {
      setMessage('Magic link sent. Check your email inbox or the server console in development.');
    }

    setLoading(false);
  };

  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
        <div className="space-y-4 sm:space-y-5">
          <p className="section-kicker">Welcome back</p>
          <h1 className="section-title font-display text-3xl font-semibold text-slate-950 sm:text-5xl">
            Sign in to your Melanam workspace.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Only registered student and instructor accounts can receive a magic login link. Admins must sign in via the admin console.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Admins: use the <a href="/admin/login" className="font-medium text-slate-900 underline">admin login</a> with the credentials in your .env.
          </p>
        </div>
        <div className="surface-strong rounded-[2rem] p-3 sm:p-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
                <p className="mt-1 text-xs text-slate-500">Use your registered email to receive a magic link.</p>
              </div>
              <AuthHelpButton mode="sign-in" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input-modern w-full"
              />
              <button type="submit" disabled={loading} className="button-primary w-full justify-center py-3 text-sm sm:text-base">
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
            {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
            <p className="mt-4 text-sm text-slate-500">
              Need an account? Create one first on the{' '}
              <Link href="/sign-up" className="font-medium text-slate-900 underline">
                sign up page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
