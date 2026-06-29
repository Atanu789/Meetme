'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaptionOverlay } from '../../../components/CaptionOverlay';
import AIResultsDisplay from '../../../components/AIResultsDisplay';
import TaskList from '../../../components/TaskList';
import Polls from '../../../components/Polls';
import { Loader } from '../../../components/Loader';
import { JitsiMeeting } from '../../../components/JitsiMeeting';
import { useSession } from 'next-auth/react';
import { normalizeJitsiRoomName } from '../../../lib/jitsi-room';
import { Radio, ShieldCheck, Sparkles, Users } from 'lucide-react';

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
  const [tokenResolved, setTokenResolved] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);
  const [aiResults, setAiResults] = useState<any | null>(null);
  const [captionPortalTarget, setCaptionPortalTarget] = useState<HTMLElement | null>(null);
  const apiRef = useRef<any>(null);
  const videoStageRef = useRef<HTMLDivElement | null>(null);

  const rawMeetingId = params.id as string;
  const meetingId = decodeURIComponent(rawMeetingId || '').trim();
  const jitsiRoomName = normalizeJitsiRoomName(meetingId);
  const userDisplayName = session?.user?.email || guestName || 'Guest';
  const userEmail = session?.user?.email || undefined;
  const fallbackRoute = session?.user?.email ? '/lms' : '/';

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
      setTokenResolved(false);
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
          } else {
            setMeetingError('Unable to get secure meeting token');
            return;
          }
        } else {
          setJwt(null);
        }
      } catch (err: any) {
        console.error('Error verifying meeting:', err);
        if (err?.name !== 'AbortError') {
          setMeetingError('Failed to verify meeting');
          setTimeout(() => router.push(fallbackRoute), 2000);
        }
      } finally {
        setTokenResolved(true);
      }
    };

    verifyMeeting();
  }, [fallbackRoute, nameReady, meetingId, router, userDisplayName]);

  // Start the bot once the room is verified so caption capture does not depend on the
  // Jitsi join event firing at the right time.
  useEffect(() => {
    if (!meeting || !nameReady || !tokenResolved) {
      return;
    }

    if (meeting.isPrivate && !jwt) {
      console.error('[meeting] Private room requires JWT. Bot start skipped.');
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
  }, [jwt, jitsiRoomName, meeting, nameReady, meetingId, tokenResolved]);

  // Open AI results panel when caption overlay dispatches event
  useEffect(() => {
    const handler = async (e: any) => {
      try {
        const detailMeetingId = e?.detail?.meetingId || meetingId;
        if (!detailMeetingId) return;

        const shouldAutoOpen = Boolean(e?.detail?.autoOpen);
        const liveSummary = e?.detail?.summary || null;
        const liveActionItems = Array.isArray(liveSummary?.actions)
          ? liveSummary.actions.map((action: any) => ({
              item: String(action?.description || action?.item || '').trim(),
              owner: action?.assignee || action?.owner ? String(action.assignee || action.owner).trim() : undefined,
            })).filter((action: any) => action.item.length > 0)
          : [];

        // Fetch meeting details (includes summary, keyDecisions, actionItems, transcript)
        const resp = await fetch(`/api/get-meeting?id=${encodeURIComponent(detailMeetingId)}`);
        let m = null;
        if (!resp.ok) {
          console.warn('[AI panel] failed to fetch meeting data');
        } else {
          const body = await resp.json();
          m = body.meeting || null;
        }

        setAiResults((current: any) => ({
          ...(m || current || {}),
          meetingId: detailMeetingId,
          summary: liveSummary?.text || m?.summary || current?.summary || '',
          keyNotes: Array.isArray(liveSummary?.keyNotes)
            ? liveSummary.keyNotes
            : m?.keyNotes || current?.keyNotes || [],
          keyDecisions: Array.isArray(liveSummary?.keyDecisions)
            ? liveSummary.keyDecisions
            : m?.keyDecisions || current?.keyDecisions || [],
          actionItems: liveActionItems.length > 0
            ? liveActionItems
            : m?.actionItems || current?.actionItems || [],
          transcript: m?.transcript || current?.transcript || [],
          speakerLabels: m?.speakerLabels || current?.speakerLabels || [],
        }));

        if (shouldAutoOpen) {
          setShowAiResults(true);
        }
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
      console.log('[meeting] video conference joined');
    });
  };

  const handleVideoStageRef = useCallback((node: HTMLDivElement | null) => {
    videoStageRef.current = node;
    setCaptionPortalTarget(node);
  }, []);

  const roomToolbarButtons = useMemo(
    () => [
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
    ],
    [meeting?.chatEnabled, meeting?.recordingEnabled]
  );

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

  return (
    <div className="mx-auto w-full max-w-[80rem] overflow-hidden px-3 pb-5 pt-4 text-slate-950 sm:px-5">
      <div className="min-w-0 space-y-3">
        <div className="surface-strong overflow-hidden rounded-[2rem] border-white/70">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-white/70 p-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Live Room
              </div>
              <h1 className="mt-2 truncate font-display text-2xl font-semibold text-slate-950">
                {meeting?.title || meetingId}
              </h1>
              <p className="mt-1 max-w-2xl truncate text-sm text-slate-500">
                {meeting?.description || 'Video, captions, files, whiteboard, recordings, polls, and AI meeting memory.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {[
                { label: 'Secure', icon: ShieldCheck },
                { label: `${meeting?.joinCount || 0} joins`, icon: Users },
                { label: 'Live tools', icon: Radio },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                  <Icon className="h-3.5 w-3.5 text-cyan-600" />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            ref={handleVideoStageRef}
            className="relative h-[calc(100dvh-13rem)] min-h-[34rem] w-full overflow-hidden bg-slate-950 sm:h-[calc(100dvh-12rem)]"
          >
            <JitsiMeeting
              roomName={jitsiRoomName}
              displayName={userDisplayName}
              userEmail={userEmail}
              captionMeetingId={meetingId}
              jwt={jwt || undefined}
              height="100%"
              prejoinPageEnabled
              startWithAudioMuted
              startWithVideoMuted
              onApiReady={handleApiReady}
              toolbarButtons={roomToolbarButtons}
            />
            <CaptionOverlay meetingId={meetingId} portalTarget={captionPortalTarget} />
          </div>
          {showAiResults && aiResults && (
            <div className="fixed right-0 top-16 z-60 h-[calc(100vh-4rem)] w-full max-w-lg overflow-auto border-l border-gray-200 bg-white/95 shadow-2xl dark:border-gray-800 dark:bg-slate-900/95">
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
                  keyNotes={aiResults?.keyNotes || []}
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
