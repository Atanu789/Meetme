'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import UploadMedia from './UploadMedia';
import AIAssistant from './AIAssistant';
import Whiteboard from './Whiteboard';

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [isDark, setIsDark] = useState(false);
  const filesPopoverRef = useRef<HTMLDivElement | null>(null);
  const roomMatch = pathname?.match(/^\/room\/([^/]+)$/);
  const roomMeetingId = roomMatch?.[1] ? decodeURIComponent(roomMatch[1]) : '';

  useEffect(() => {
    setIsFilesOpen(false);
    setIsProductsOpen(false);
    setIsDropdownOpen(false);
    setIsWhiteboardOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isFilesOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (filesPopoverRef.current && !filesPopoverRef.current.contains(event.target as Node)) {
        setIsFilesOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isFilesOpen]);

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

  useEffect(() => {
    if (!isWhiteboardOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsWhiteboardOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isWhiteboardOpen]);

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
    {
      name: 'Meetings',
      href: '/dashboard',
      tag: 'Live',
      description: 'Create rooms and start calls fast.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-100 hover:shadow-[0_14px_30px_rgba(6,182,212,0.2)]',
      tagClass: 'bg-cyan-500/15 text-cyan-800 ring-cyan-500/20',
    },
    {
      name: 'Live Captions',
      href: '/dashboard',
      tag: 'AI',
      description: 'Stream captions in real time.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100 hover:shadow-[0_14px_30px_rgba(139,92,246,0.2)]',
      tagClass: 'bg-violet-500/15 text-violet-800 ring-violet-500/20',
    },
    {
      name: 'File Share',
      href: '/dashboard',
      tag: 'Now',
      description: 'Keep room uploads in one place.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-[0_14px_30px_rgba(16,185,129,0.2)]',
      tagClass: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/20',
    },
    {
      name: 'Future Product 1',
      href: '/dashboard',
      tag: 'Soon',
      description: 'Upcoming workflow tools.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 hover:shadow-[0_14px_30px_rgba(245,158,11,0.2)]',
      tagClass: 'bg-amber-500/15 text-amber-800 ring-amber-500/20',
    },
    {
      name: 'Future Product 2',
      href: '/dashboard',
      tag: 'Soon',
      description: 'More team utilities on the way.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 hover:shadow-[0_14px_30px_rgba(244,63,94,0.2)]',
      tagClass: 'bg-rose-500/15 text-rose-800 ring-rose-500/20',
    },
  ];

  const navActionBoxClass =
    'group inline-flex h-8 items-center whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 text-left text-sm font-medium leading-none text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200';
  const copyInviteHoverClass =
    'hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-950 hover:shadow-[0_14px_30px_rgba(14,165,233,0.2)]';
  const uploadMediaHoverClass =
    'hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-950 hover:shadow-[0_14px_30px_rgba(16,185,129,0.2)]';
  const whiteboardHoverClass =
    'hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-950 hover:shadow-[0_14px_30px_rgba(245,158,11,0.22)]';
  const themeHoverClass =
    'hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100 hover:text-violet-950 hover:shadow-[0_14px_30px_rgba(139,92,246,0.2)]';

  return (
    <nav className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-5">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/60 bg-white/52 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-[28px] supports-[backdrop-filter]:bg-white/52">
        <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm sm:h-9 sm:w-9">
                <span className="font-display text-base font-semibold">M</span>
              </div>
              <span className="hidden sm:inline font-display text-xl font-semibold text-slate-950">
                Melanam
              </span>
            </Link>

            <div
              className="relative hidden md:block"
              onMouseEnter={() => setIsProductsOpen(true)}
              onMouseLeave={() => setIsProductsOpen(false)}
            >
              <button
                onClick={() => setIsProductsOpen((prev) => !prev)}
                onFocus={() => setIsProductsOpen(true)}
                className={`inline-flex h-8 items-center whitespace-nowrap rounded-lg border px-2.5 text-left text-sm font-medium leading-none transition duration-200 ${
                  isProductsOpen
                    ? 'border-cyan-300 bg-cyan-100 text-cyan-950 shadow-[0_14px_30px_rgba(6,182,212,0.2)]'
                    : 'border-slate-200 bg-slate-100/80 text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-950 hover:shadow-[0_14px_30px_rgba(6,182,212,0.2)]'
                }`}
              >
                Products
              </button>
              {isProductsOpen && (
                <div
                  className="absolute left-0 mt-2 w-[22rem] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white/95 p-2.5 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setIsProductsOpen(false);
                    }
                  }}
                >
                  {productLinks.map((product) => (
                    <Link
                      key={product.name}
                      href={product.href}
                      className={`group flex items-start justify-between gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-100/80 px-3.5 py-3 text-sm text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ${product.hoverClass}`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 transition group-hover:text-slate-950">
                          {product.name}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {product.description}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition ${product.tagClass}`}>
                        {product.tag}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {pathname?.startsWith('/room/') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInvite}
                  className={`${navActionBoxClass} ${copyInviteHoverClass}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 transition group-hover:text-slate-950">Copy invite</div>
                  </div>
                </button>
                <AIAssistant meetingId={roomMeetingId} />
                <button
                  onClick={() => setIsWhiteboardOpen((prev) => !prev)}
                  className={`${navActionBoxClass} ${
                    isWhiteboardOpen
                      ? 'border-amber-200 bg-amber-50/85 text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.12)]'
                      : whiteboardHoverClass
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 transition group-hover:text-slate-950">🖍 Whiteboard</div>
                  </div>
                </button>
                <div ref={filesPopoverRef} className="relative">
                  <button
                    onClick={() => setIsFilesOpen((prev) => !prev)}
                    className={`${navActionBoxClass} ${
                      isFilesOpen
                        ? 'border-emerald-200 bg-emerald-50/85 text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.12)]'
                        : uploadMediaHoverClass
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 transition group-hover:text-slate-950">Upload Media</div>
                    </div>
                  </button>
                  {isFilesOpen && (
                    <div className="absolute left-0 mt-3 w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
                      <UploadMedia
                        meetingId={roomMeetingId}
                        userEmail={userEmail}
                        className="rounded-[1.75rem] border-0 bg-white p-0"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={toggleTheme}
              className={`${navActionBoxClass} ${themeHoverClass}`}
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              <div className="min-w-0">
                <div className="text-slate-900 transition group-hover:text-slate-950">{isDark ? 'Light' : 'Dark'}</div>
              </div>
            </button>
            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="hidden h-8 items-center whitespace-nowrap px-1 text-sm leading-none text-slate-500 lg:inline-flex">
                  {userEmail}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold leading-none text-white shadow-sm"
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
      {isWhiteboardOpen && roomMeetingId && (
        <div className="fixed inset-0 z-[70]">
          <button
            aria-label="Close whiteboard backdrop"
            onClick={() => setIsWhiteboardOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[72rem] flex-col border-l border-white/10 bg-slate-950 shadow-[0_28px_100px_rgba(2,6,23,0.45)] sm:w-[92vw]">
            <Whiteboard meetingId={roomMeetingId} onClose={() => setIsWhiteboardOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}

