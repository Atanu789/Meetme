'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import FileShare from './FileShare';

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [isDark, setIsDark] = useState(false);

  const roomMatch = pathname?.match(/^\/room\/([^/]+)$/);
  const activeMeetingId = roomMatch?.[1] ? decodeURIComponent(roomMatch[1]) : '';

  useEffect(() => {
    setIsFilesOpen(false);
    setIsProductsOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

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

  const handleCopyInvite = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else if (typeof window !== 'undefined') {
        const tempInput = document.createElement('input');
        tempInput.value = window.location.href;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopyStatus('Invite link copied');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleLeave = () => {
    router.push(isLoggedIn ? '/dashboard' : '/');
  };

  const userEmail = session?.user?.email || '';
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U';
  const isLoggedIn = status === 'authenticated';

  const productLinks = [
    { name: 'Meetings', href: '/dashboard', tag: 'Live' },
    { name: 'Live Captions', href: '/dashboard', tag: 'AI' },
    { name: 'File Share', href: '/dashboard', tag: 'Now' },
    { name: 'Future Product 1', href: '/dashboard', tag: 'Soon' },
    { name: 'Future Product 2', href: '/dashboard', tag: 'Soon' },
  ];

  return (
    <nav className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-5">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/60 bg-white/52 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-[28px] supports-[backdrop-filter]:bg-white/52">
        <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm sm:h-9 sm:w-9">
                <span className="font-display text-base font-semibold">M</span>
              </div>
              <span className="hidden sm:inline font-display text-xl font-semibold text-slate-950">
                Melanam
              </span>
            </Link>

            <div className="relative hidden md:block">
              <button
                onClick={() => setIsProductsOpen((prev) => !prev)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80"
              >
                Products
              </button>
              {isProductsOpen && (
                <div className="absolute left-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  {productLinks.map((product) => (
                    <Link
                      key={product.name}
                      href={product.href}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>{product.name}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {product.tag}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {activeMeetingId && (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col leading-tight">
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">Meeting</span>
                  <span className="max-w-[160px] truncate text-sm font-medium text-slate-700">ID: {activeMeetingId}</span>
                </div>
                <button
                  onClick={handleCopyInvite}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Copy invite
                </button>
                <button
                  onClick={handleLeave}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Leave
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsFilesOpen((prev) => !prev)}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Files
                  </button>
                  {isFilesOpen && (
                    <div className="absolute left-0 mt-2 w-[330px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                      <FileShare
                        meetingId={activeMeetingId}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="button-secondary px-3 py-2 text-xs sm:px-3 sm:py-2"
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden text-sm text-slate-500 lg:inline">
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
      {copyStatus && (
        <div className="fixed top-20 right-4 z-[60] rounded-lg bg-emerald-500/90 px-4 py-2 text-white shadow-lg">
          {copyStatus}
        </div>
      )}
    </nav>
  );
}

