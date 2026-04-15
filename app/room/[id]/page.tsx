'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { useScript } from '@/hooks/useScript';
import { Loader } from '@/components/Loader';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  const fallbackTriedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(true);
  const [copyStatus, setCopyStatus] = useState('');
  const [error, setError] = useState('');

  const meetingId = params.id as string;
  const configuredDomain =
    process.env.NEXT_PUBLIC_JITSI_DOMAIN?.replace(/^https?:\/\//, '').trim() ||
    'meet.jit.si';
  const [activeDomain, setActiveDomain] = useState(configuredDomain);
  const { loaded: scriptLoaded, error: scriptError } = useScript(
    `https://${activeDomain}/external_api.js`,
    12000
  );

  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      setLoading((current) => {
        if (!current) {
          return current;
        }

        setError('Video call setup timed out. Please try again.');
        return false;
      });
    }, 25000);

    return () => clearTimeout(hardTimeout);
  }, []);

  useEffect(() => {
    if (!scriptError) {
      return;
    }

    if (activeDomain !== 'meet.jit.si' && !fallbackTriedRef.current) {
      fallbackTriedRef.current = true;
      setActiveDomain('meet.jit.si');
      return;
    }

    setLoading(false);
    setError(
      'Unable to load video service. Set NEXT_PUBLIC_JITSI_DOMAIN to a reachable host (e.g. meet.jit.si) and refresh.'
    );
  }, [scriptError, activeDomain]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (scriptLoaded && !error) {
      setJoining(false);
    }
  }, [scriptLoaded, error]);

  useEffect(() => {
    const initializeJitsi = async () => {
      if (!scriptLoaded || !isLoaded || !user) {
        return;
      }

      if (!containerRef.current) {
        return;
      }

      try {
        setJoining(true);
        const controller = new AbortController();
        const requestTimeout = setTimeout(() => controller.abort(), 10000);

        // Verify meeting exists
        const meetingResponse = await fetch(`/api/get-meeting?id=${meetingId}`, {
          signal: controller.signal,
        });
        clearTimeout(requestTimeout);

        if (!meetingResponse.ok) {
          setError('Meeting not found');
          setLoading(false);
          setJoining(false);
          setTimeout(() => router.push('/dashboard'), 2000);
          return;
        }

        if (window.JitsiMeetExternalAPI) {
          const domain = activeDomain;

          jitsiRef.current = new window.JitsiMeetExternalAPI(domain, {
            roomName: meetingId,
            parentNode: containerRef.current,
            width: '100%',
            height: '100%',
            userInfo: {
              email: user.emailAddresses[0]?.emailAddress,
              displayName: user.firstName || user.emailAddresses[0]?.emailAddress,
            },
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              disableSimulcast: false,
              enableNoisyMicDetection: true,
              prejoinPageEnabled: false,
            },
            interfaceConfigOverwrite: {
              TOOLBAR_BUTTONS: [
                'microphone',
                'camera',
                'closedcaptions',
                'desktop',
                'fullscreen',
                'fooemoteicon',
                'hangup',
                'chat',
                'recording',
                'livestream',
                'etherpad',
                'sharedvideo',
                'settings',
                'raisehand',
                'videoquality',
                'filmstrip',
                'stats',
                'shortcuts',
                'tileview',
                'toggle-camera',
              ],
              LANG_DETECTION: true,
              SHOW_CHROME_EXTENSION_BANNER: false,
              MOBILE_APP_PROMO: false,
            },
          });

          setLoading(false);
          setJoining(false);

          // Handle events
          jitsiRef.current.addEventListener('readyToClose', () => {
            router.push('/dashboard');
          });
        } else {
          setLoading(false);
          setJoining(false);
          setError('Video service loaded but failed to initialize. Please refresh.');
        }
      } catch (err: any) {
        console.error('Error initializing Jitsi:', err);
        setLoading(false);
        setJoining(false);

        if (err?.name === 'AbortError') {
          setError('Meeting lookup timed out. Please try again.');
          return;
        }

        setError('Failed to initialize video call');
      }
    };

    initializeJitsi();

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
      }
    };
  }, [scriptLoaded, isLoaded, user, meetingId, router, activeDomain]);

  if (!isLoaded) {
    return <Loader />;
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">{error}</p>
          <p className="text-gray-400 text-sm mb-4">
            Meeting ID: {meetingId}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
          <div className="text-center space-y-4 px-6">
            <Loader />
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {joining ? 'Joining...' : 'Loading meeting...'}
              </h2>
              <p className="text-gray-400 mt-2">
                {joining
                  ? 'Preparing your video room and checking meeting access.'
                  : 'Loading the meeting experience.'}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-3">
        <div className="backdrop-blur-md bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Meeting ID
          </p>
          <p className="font-semibold">{meetingId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                if (navigator.clipboard?.writeText) {
                  await navigator.clipboard.writeText(window.location.href);
                } else {
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
            }}
            className="px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-white hover:bg-slate-700 transition"
          >
            Copy invite link
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-gray-200 hover:bg-slate-700 transition"
          >
            Leave
          </button>
        </div>
      </div>
      {copyStatus && (
        <div className="absolute top-20 right-4 z-30 rounded-lg bg-emerald-500/90 text-white px-4 py-2 shadow-lg">
          {copyStatus}
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
