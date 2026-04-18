'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { data: session, status } = useSession();
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
    await signOut({ redirect: false });
    router.push('/');
  };

  const userEmail = session?.user?.email || '';
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U';
  const isLoggedIn = status === 'authenticated';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/78 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm sm:h-9 sm:w-9">
              <span className="font-display text-base font-semibold">M</span>
            </div>
            <span className="hidden sm:inline font-display text-xl font-semibold text-slate-950">
              Melanam
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="button-secondary px-3 py-2 text-xs sm:px-3 sm:py-2"
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="hidden text-sm text-slate-500 md:inline">
                  {userEmail}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-sm sm:h-10 sm:w-10"
                  >
                    {userInitial}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-52">
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
                <Link href="/sign-in" className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-950 transition sm:px-4 sm:text-sm">
                  Sign In
                </Link>
                <Link href="/sign-in" className="button-primary px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

