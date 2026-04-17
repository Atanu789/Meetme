'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

      document.documentElement.classList.toggle('dark', shouldUseDark);
      setIsDark(shouldUseDark);
    } catch {
      // Keep default if storage/media query are unavailable.
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const userEmail = user?.emailAddresses[0]?.emailAddress || '';
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/78 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <span className="font-display text-base font-semibold">M</span>
            </div>
            <span className="hidden sm:inline font-display text-xl font-semibold text-slate-950">
              Meetme
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="button-secondary px-3 py-2 text-xs"
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden text-sm text-slate-500 sm:inline">
                  {userEmail}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-sm"
                  >
                    {userInitial}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-950 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="button-primary px-4 py-2 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
