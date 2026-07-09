'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, PencilLine, Radio, ShieldCheck, Upload, Video } from 'lucide-react';
import FileShare from './FileShare';
import { AudioCapture } from './AudioCapture';
import Whiteboard from './Whiteboard';
import { YouTubeStreamModal } from './YouTubeStreamModal';
import { useRecording } from '@/hooks/useRecording';
import { useLivestream } from '@/hooks/useLivestream';

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardCloseRequestId, setWhiteboardCloseRequestId] = useState(0);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const filesPopoverRef = useRef<HTMLDivElement | null>(null);
  const roomMatch = pathname?.match(/^\/room\/([^/]+)$/);
  const roomMeetingId = roomMatch?.[1] ? decodeURIComponent(roomMatch[1]) : '';
  const currentUrl = pathname ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}` : '/';
  const signInHref = status === 'authenticated' ? '/lms' : `/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`;

  // Initialize recording and livestream hooks
  const { isRecording, startRecording, stopRecording, loading: recordingLoading, error: recordingError, clearError: clearRecordingError } = useRecording(roomMeetingId);
  const { isStreaming, startLivestream, stopLivestream, loading: livestreamLoading, error: livestreamError, clearError: clearLivestreamError } = useLivestream(roomMeetingId);

  const requestWhiteboardClose = useCallback(() => {
    setWhiteboardCloseRequestId((requestId) => requestId + 1);
  }, []);

  useEffect(() => {
    setIsFilesOpen(false);
    setIsDropdownOpen(false);
    setIsWhiteboardOpen(false);
    setIsYouTubeModalOpen(false);
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

    if (!isWhiteboardOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestWhiteboardClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isWhiteboardOpen, requestWhiteboardClose]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace('/');
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
    router.push(isLoggedIn ? '/lms' : '/');
  };

  const userEmail = session?.user?.email || '';
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U';
  const isLoggedIn = status === 'authenticated';

  const productLinks = [
    {
      name: 'Meetings',
      href: '/lms',
      tag: 'Live',
      description: 'Create rooms and start calls fast.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-100 hover:shadow-[0_14px_30px_rgba(6,182,212,0.2)]',
      tagClass: 'bg-cyan-500/15 text-cyan-800 ring-cyan-500/20',
    },
    {
      name: 'Live Captions',
      href: '/lms',
      tag: 'AI',
      description: 'Stream captions in real time.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100 hover:shadow-[0_14px_30px_rgba(139,92,246,0.2)]',
      tagClass: 'bg-violet-500/15 text-violet-800 ring-violet-500/20',
    },
    {
      name: 'File Share',
      href: '/lms',
      tag: 'Now',
      description: 'Keep room uploads in one place.',
      hoverClass: 'hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-[0_14px_30px_rgba(16,185,129,0.2)]',
      tagClass: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/20',
    },
  ];

  const navIconButtonClass =
    'group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100/80 text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200';
  const copyInviteButtonClass =
    'group inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 px-3 text-sm font-semibold text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200';
  const copyInviteHoverClass =
    'hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-950 hover:shadow-[0_14px_30px_rgba(14,165,233,0.2)]';
  const uploadMediaHoverClass =
    'hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-950 hover:shadow-[0_14px_30px_rgba(16,185,129,0.2)]';
  const whiteboardHoverClass =
    'hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-950 hover:shadow-[0_14px_30px_rgba(245,158,11,0.22)]';
  const recordingHoverClass =
    'hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:text-red-950 hover:shadow-[0_14px_30px_rgba(239,68,68,0.2)]';
  const livestreamHoverClass =
    'hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-950 hover:shadow-[0_14px_30px_rgba(244,63,94,0.2)]';

  return (
    <nav className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-5">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/45 bg-white/42 shadow-[0_22px_70px_rgba(15,23,42,0.18)] backdrop-blur-[45px] supports-[backdrop-filter]:bg-white/42">
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

            {/* Products and pricing removed from navbar per admin request */}

            {pathname?.startsWith('/room/') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInvite}
                  className={`${copyInviteButtonClass} ${copyInviteHoverClass}`}
                  aria-label="Copy invite link"
                  title="Copy invite link"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy link</span>
                </button>
                <AudioCapture meetingId={roomMeetingId} className="relative flex flex-col gap-2" />
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording(roomMeetingId);
                    } else {
                      startRecording(roomMeetingId);
                    }
                  }}
                  disabled={recordingLoading}
                  className={`${navIconButtonClass} ${
                    isRecording
                      ? 'border-red-200 bg-red-50/85 text-red-950 shadow-[0_10px_24px_rgba(239,68,68,0.12)]'
                      : recordingHoverClass
                  } disabled:opacity-50`}
                  aria-label={isRecording ? 'Stop local recording' : 'Start local recording'}
                  title={isRecording ? 'Stop local recording' : 'Start local recording'}
                >
                  <Radio className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (isStreaming) {
                      stopLivestream(roomMeetingId);
                    } else {
                      setIsYouTubeModalOpen(true);
                    }
                  }}
                  disabled={livestreamLoading}
                  className={`${navIconButtonClass} ${
                    isStreaming
                      ? 'border-rose-200 bg-rose-50/85 text-rose-950 shadow-[0_10px_24px_rgba(244,63,94,0.12)]'
                      : livestreamHoverClass
                  } disabled:opacity-50`}
                  aria-label={isStreaming ? 'Stop livestream' : 'Start livestream'}
                  title={isStreaming ? 'Stop livestream' : 'Start livestream'}
                >
                  <Video className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (isWhiteboardOpen) {
                      requestWhiteboardClose();
                    } else {
                      setIsWhiteboardOpen(true);
                    }
                  }}
                  className={`${navIconButtonClass} ${
                    isWhiteboardOpen
                      ? 'border-amber-200 bg-amber-50/85 text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.12)]'
                      : whiteboardHoverClass
                  }`}
                  aria-label={isWhiteboardOpen ? 'Close whiteboard' : 'Open whiteboard'}
                  title={isWhiteboardOpen ? 'Close whiteboard' : 'Open whiteboard'}
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                <div ref={filesPopoverRef} className="relative">
                  <button
                    onClick={() => setIsFilesOpen((prev) => !prev)}
                    className={`${navIconButtonClass} ${
                      isFilesOpen
                        ? 'border-emerald-200 bg-emerald-50/85 text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.12)]'
                        : uploadMediaHoverClass
                    }`}
                    aria-label={isFilesOpen ? 'Close upload media' : 'Open upload media'}
                    title={isFilesOpen ? 'Close upload media' : 'Open upload media'}
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  {isFilesOpen && (
                    <div className="absolute left-0 mt-3 w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
                      <FileShare
                        meetingId={roomMeetingId}
                        scopeType="meeting"
                        title="Shared Files"
                        className="border-0 bg-transparent p-0"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
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
                        href="/lms"
                        className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        LMS Dashboard
                      </Link>
                      {(session?.user as any)?.role === 'admin' && (
                        <Link
                          href="/lms/admin"
                          className="block px-4 py-3 text-sm text-cyan-700 hover:bg-slate-50 transition font-medium"
                        >
                          System Console
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {pathname === '/' && (
                  <Link
                    href="/admin/login"
                    className="font-display inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white/55 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white/85 hover:text-slate-950"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin Login</span>
                  </Link>
                )}
                <Link
                  href={signInHref}
                  className="font-display inline-flex items-center gap-2 rounded-xl border border-cyan-200/70 bg-cyan-50/70 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-100/85 hover:text-cyan-900"
                >
                  Sign In
                </Link>
                <Link
                  href={signInHref}
                  className="font-display group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-emerald-400 active:scale-[0.97]"
                >
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
      {recordingError && (
        <div className="fixed top-20 right-4 z-[60] rounded-lg bg-red-500/90 px-4 py-2 text-white shadow-lg flex items-center justify-between gap-3">
          <span>{recordingError}</span>
          <button
            onClick={clearRecordingError}
            className="text-white hover:text-red-100 transition"
          >
            ✕
          </button>
        </div>
      )}
      {livestreamError && (
        <div className="fixed top-20 right-4 z-[60] rounded-lg bg-red-500/90 px-4 py-2 text-white shadow-lg flex items-center justify-between gap-3">
          <span>{livestreamError}</span>
          <button
            onClick={clearLivestreamError}
            className="text-white hover:text-red-100 transition"
          >
            ✕
          </button>
        </div>
      )}
      {isWhiteboardOpen && roomMeetingId && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70]">
          <button
            aria-label="Close whiteboard backdrop"
            onClick={requestWhiteboardClose}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[72rem] flex-col border-l border-white/10 bg-slate-950 shadow-[0_28px_100px_rgba(2,6,23,0.45)] sm:w-[92vw]">
            <Whiteboard
              meetingId={roomMeetingId}
              closeRequestId={whiteboardCloseRequestId}
              onClose={() => setIsWhiteboardOpen(false)}
            />
          </div>
        </div>,
        document.body
      )}
      <YouTubeStreamModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onSubmit={(streamUrl) => startLivestream(roomMeetingId, streamUrl)}
        loading={livestreamLoading}
      />
    </nav>
  );
}

