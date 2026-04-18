"use client";

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function Page() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      callbackUrl: '/',
      redirect: false,
    });

    if (result?.error) {
      setMessage('Failed to send login link. Please try again.');
    } else {
      setMessage('Magic link sent. Check your email inbox.');
    }

    setLoading(false);
  };

  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <p className="section-kicker">Get started</p>
          <h1 className="section-title font-display text-5xl font-semibold text-slate-950">
            Create a professional meeting workspace.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Build private rooms, store chats, and keep meeting history in a clean interface your team can trust.
          </p>
        </div>
        <div className="surface-strong rounded-[2rem] p-4 sm:p-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input-modern w-full"
              />
              <button type="submit" disabled={loading} className="button-primary w-full justify-center py-3">
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
            {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
            <p className="mt-4 text-sm text-slate-500">
              Already have access? Go to{' '}
              <Link href="/sign-in" className="font-medium text-slate-900 underline">
                sign in
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
