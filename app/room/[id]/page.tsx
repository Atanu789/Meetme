'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CaptionOverlay } from '../../../components/CaptionOverlay';
import AIResultsDisplay from '../../../components/AIResultsDisplay';
import TaskList from '../../../components/TaskList';
import Polls from '../../../components/Polls';
import { Loader } from '../../../components/Loader';
import { JitsiMeeting } from '../../../components/JitsiMeeting';
import { useSession } from 'next-auth/react';
import { normalizeJitsiRoomName } from '../../../lib/jitsi-room';

interface MeetingDetails {
  _id: string;
  meetingId: string;
  title: string;
  description?: string;
  hostEmail: string;
  isPrivate: boolean;
  chatEnabled: boolean;
  recordingEnabled: boolean;
  joinCount: number;
  lastSessionAt?: string | null;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [guestName, setGuestName] = useState('');
  const [nameReady, setNameReady] = useState(false);
  const [meetingError, setMeetingError] = useState('');
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [hasJoinedConference, setHasJoinedConference] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);
  const [aiResults, setAiResults] = useState<any | null>(null);
  const apiRef = useRef<any>(null);
  const joinedLoggedRef = useRef(false);

  const rawMeetingId = params.id as string;
  const meetingId = decodeURIComponent(rawMeetingId || '').trim();
  const jitsiRoomName = normalizeJitsiRoomName(meetingId);
  const userDisplayName = session?.user?.email || guestName || 'Guest';
  const userEmail = session?.user?.email || undefined;
  const fallbackRoute = session?.user?.email ? '/dashboard' : '/';

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (session?.user?.email) {
      setNameReady(true);
      return;
    }

    let storedName = '';

    try {
      storedName = localStorage.getItem('username') || '';
    } catch {
      storedName = '';
    }

    if (!storedName.trim()) {
      const fallbackName = `Guest-${Math.floor(Math.random() * 1000)}`;
      storedName = fallbackName;

      try {
        localStorage.setItem('username', storedName);
      } catch {
        // Ignore storage failures.
      }
    }

    setGuestName(storedName);
    setNameReady(true);
  }, [session?.user?.email, status]);

  // Verify meeting exists on component mount
  useEffect(() => {
    if (!nameReady) {
      return;
    }

    const verifyMeeting = async () => {
      try {
        const controller = new AbortController();
        const requestTimeout = setTimeout(() => controller.abort(), 10000);

        const meetingResponse = await fetch(
          `/api/get-meeting?id=${encodeURIComponent(meetingId)}`,
          {
          signal: controller.signal,
          }
        );
        clearTimeout(requestTimeout);

        if (!meetingResponse.ok) {
          setMeetingError('Meeting not found');
          setTimeout(() => router.push(fallbackRoute), 2000);
          return;
        }

        const meetingData = await meetingResponse.json();
        setMeeting(meetingData.meeting);

        if (meetingData.meeting?.isPrivate) {
          const tokenResponse = await fetch(`/api/meeting-token?meetingId=${encodeURIComponent(meetingId)}&name=${encodeURIComponent(userDisplayName)}`);

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            setJwt(tokenData.token || null);
          }
        }
      } catch (err: any) {
        console.error('Error verifying meeting:', err);
        if (err?.name !== 'AbortError') {
          setMeetingError('Failed to verify meeting');
          setTimeout(() => router.push(fallbackRoute), 2000);
        }
      }
    };

    verifyMeeting();
  }, [fallbackRoute, nameReady, meetingId, router, userDisplayName]);

  // Trigger bot only after the user joins, so host keeps moderator controls.
  useEffect(() => {
    if (!meeting || !nameReady || !hasJoinedConference) {
      return;
    }

    const triggerBot = async () => {
      try {
        // Construct the Jitsi meeting URL
        const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
        const cleanDomain = jitsiDomain.replace(/^https?:\/\//, '').trim();
        const meetingUrl = `https://${cleanDomain}/${jitsiRoomName}`;

        console.log('[meeting] Triggering bot to join:', meetingUrl);

        const response = await fetch('/api/start-bot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId,
            meetingUrl,
            botName: 'Melanam Live Captions Bot',
            jwt,
            platform: 'jitsi',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[meeting] Bot trigger response:', data);
        } else {
          console.error('[meeting] Failed to trigger bot:', response.status);
        }
      } catch (error) {
        console.error('[meeting] Error triggering bot:', error);
      }
    };

    triggerBot();
  }, [hasJoinedConference, jwt, jitsiRoomName, meeting, nameReady, meetingId]);

  // Open AI results panel when caption overlay dispatches event
  useEffect(() => {
    const handler = async (e: any) => {
      try {
        const detailMeetingId = e?.detail?.meetingId || meetingId;
        if (!detailMeetingId) return;

        // Fetch meeting details (includes summary, keyDecisions, actionItems, transcript)
        const resp = await fetch(`/api/get-meeting?id=${encodeURIComponent(detailMeetingId)}`);
        if (!resp.ok) {
          console.warn('[AI panel] failed to fetch meeting data');
          return;
        }

        const body = await resp.json();
        const m = body.meeting || null;
        setAiResults(m);
        setShowAiResults(true);
      } catch (err) {
        console.error('[AI panel] error opening AI results', err);
      }
    };

    window.addEventListener('open-ai-summary', handler as EventListener);
    return () => window.removeEventListener('open-ai-summary', handler as EventListener);
  }, [meetingId]);

  const handleApiReady = (api: any) => {
    apiRef.current = api;

    api.addEventListener('videoConferenceJoined', () => {
      if (!joinedLoggedRef.current) {
        joinedLoggedRef.current = true;
        setHasJoinedConference(true);
      }
    });
  };

  const handleMeetingClose = async () => {
    router.push(fallbackRoute);
  };

  if (status === 'loading' || !nameReady) {
    return <Loader />;
  }

  if (meetingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">{meetingError}</p>
          <p className="text-gray-400 text-sm mb-4">
            Meeting ID: {meetingId}
          </p>
          <button
            onClick={() => router.push(fallbackRoute)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const roomToolbarButtons = [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'hangup',
    ...(meeting?.chatEnabled !== false ? ['chat'] : []),
    ...(meeting?.recordingEnabled !== false ? ['recording'] : []),
    'settings',
    'raisehand',
    'tileview',
    'participants-pane',
    'stats',
    'shortcuts',
    'security',
    'download',
  ];

  return (
    <div className="page-shell-wide text-slate-950">
      <div className="space-y-3 sm:space-y-4">
        <div className="surface-strong overflow-hidden rounded-[2rem]">
          <div className="relative h-[76vh] min-h-[620px] sm:h-[calc(100vh-11rem)]">
            <JitsiMeeting
              roomName={jitsiRoomName}
              displayName={userDisplayName}
              userEmail={userEmail}
              jwt={jwt || undefined}
              height="100%"
              onApiReady={handleApiReady}
              onReadyToClose={handleMeetingClose}
              toolbarButtons={roomToolbarButtons}
            />
          </div>

          <CaptionOverlay meetingId={meetingId} />
          {showAiResults && aiResults && (
            <div className="fixed right-0 top-16 z-60 h-[calc(100vh-4rem)] w-full max-w-lg overflow-auto bg-white/95 dark:bg-slate-900/95 border-l border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold">AI Meeting Results</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAiResults(false)} className="text-sm text-slate-600 dark:text-slate-300">Close</button>
                </div>
              </div>
              <div className="p-4">
                <AIResultsDisplay
                  meetingId={meetingId}
                  summary={aiResults?.summary}
                  keyDecisions={aiResults?.keyDecisions || []}
                  actionItems={aiResults?.actionItems || []}
                  transcript={aiResults?.transcript || []}
                  speakerLabels={aiResults?.speakerLabels || []}
                />
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Tasks from this meeting</h4>
                  <TaskList meetingId={meetingId} />
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Live Polls</h4>
                  <Polls meetingId={meetingId} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
