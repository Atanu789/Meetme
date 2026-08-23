"use client";

import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

type AuthHelpButtonProps = {
  mode: 'sign-in' | 'sign-up';
};

export function AuthHelpButton({ mode }: AuthHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const isSignUp = mode === 'sign-up';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
        aria-expanded={open}
        aria-label="Show sign in and sign up help"
      >
        <HelpCircle className="h-4 w-4" />
        Help
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950">
                {isSignUp ? 'How sign up works' : 'How sign in works'}
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isSignUp
                  ? 'Enter your email and open the secure magic link sent to your inbox.'
                  : 'Enter your email and we will send a secure magic link. New accounts are created automatically.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close help"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 rounded-xl bg-cyan-50 p-3 text-xs leading-5 text-cyan-900">
            <>
              Use the same email screen whether this is your first visit or you are returning.
              {isSignUp ? ' Existing links now open that screen too.' : ''}
            </>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Admin users should use the admin login because admin accounts are provisioned separately.
          </p>
        </div>
      ) : null}
    </div>
  );
}
