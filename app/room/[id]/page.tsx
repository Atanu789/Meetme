'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { Loader } from '../../../components/Loader';
import { JitsiMeeting } from '../../../components/JitsiMeeting';

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

interface ChatMessage {
  _id: string;
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
}

interface ActivityItem {
  _id: string;
  type: string;
  details?: string;
  userName: string;
  createdAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [copyStatus, setCopyStatus] = useState('');
  const [meetingError, setMeetingError] = useState('');
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const apiRef = useRef<any>(null);
  const joinedLoggedRef = useRef(false);

  const rawMeetingId = params.id as string;
  const meetingId = decodeURIComponent(rawMeetingId || '').trim();

  // Verify user is authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoaded, router]);

  // Verify meeting exists on component mount
  useEffect(() => {
    if (!isLoaded || !user) {
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
          setTimeout(() => router.push('/dashboard'), 2000);
          return;
        }

        const meetingData = await meetingResponse.json();
        setMeeting(meetingData.meeting);

        const [messagesResponse, activityResponse] = await Promise.all([
          fetch(`/api/meeting-messages?meetingId=${encodeURIComponent(meetingId)}`),
          fetch(`/api/meeting-activity?meetingId=${encodeURIComponent(meetingId)}`),
        ]);

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages || []);
        }

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivity(activityData.activity || []);
        }

        if (meetingData.meeting?.isPrivate) {
          const tokenResponse = await fetch(
            `/api/meeting-token?meetingId=${encodeURIComponent(meetingId)}`
          );

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            setJwt(tokenData.token || null);
          }
        }
      } catch (err: any) {
        console.error('Error verifying meeting:', err);
        if (err?.name !== 'AbortError') {
          setMeetingError('Failed to verify meeting');
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      }
    };

    verifyMeeting();
  }, [isLoaded, user, meetingId, router]);

  const recordActivity = async (type: string, details?: string) => {
    try {
      await fetch('/api/meeting-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId, type, details }),
      });
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  };

  const handleApiReady = (api: any) => {
    apiRef.current = api;

    api.addEventListener('videoConferenceJoined', () => {
      if (!joinedLoggedRef.current) {
        joinedLoggedRef.current = true;
        recordActivity('joined', 'Joined the meeting room');
      }
    });

    api.addEventListener('incomingMessage', (payload: any) => {
      const text = payload?.message || payload?.text || '';
      const senderName = payload?.nick || payload?.from?.displayName || 'Participant';
      const senderEmail = payload?.from?.email || '';

      if (!text || senderName === (user?.firstName || user?.emailAddresses[0]?.emailAddress)) {
        return;
      }

      setMessages((current) => [
        ...current,
        {
          _id: `${Date.now()}-${Math.random()}`,
          senderName,
          senderEmail,
          message: text,
          createdAt: new Date().toISOString(),
        },
      ]);

      void fetch('/api/meeting-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId, message: text }),
      });
    });
  };

  const handleMeetingClose = async () => {
    await recordActivity('left', 'Left the meeting room');
    router.push('/dashboard');
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || !meeting?.chatEnabled) {
      return;
    }

    setIsSending(true);

    try {
      apiRef.current?.executeCommand?.('sendChatMessage', text);

      setMessages((current) => [
        ...current,
        {
          _id: `${Date.now()}-${Math.random()}`,
          senderName: user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Guest',
          senderEmail: user?.emailAddresses[0]?.emailAddress,
          message: text,
          createdAt: new Date().toISOString(),
        },
      ]);

      await fetch('/api/meeting-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId, message: text }),
      });

      setMessageText('');
      await recordActivity('chat', text);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleRecordingToggle = async () => {
    try {
      apiRef.current?.executeCommand?.('toggleRecording');
      const nextState = !isRecording;
      setIsRecording(nextState);
      await recordActivity(nextState ? 'recording-started' : 'recording-stopped');
    } catch (error) {
      console.error('Failed to toggle recording:', error);
    }
  };

  if (!isLoaded) {
    return <Loader />;
  }

  if (!user) {
    return null;
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
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const userDisplayName = user.firstName || user.emailAddresses[0]?.emailAddress || 'Guest';
  const userEmail = user.emailAddresses[0]?.emailAddress;

  return (
    <div className="page-shell-wide text-slate-950">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="surface-strong flex-1 min-w-0 overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur">
              <div>
                <p className="section-kicker mb-1">Meeting</p>
                <h1 className="font-display text-lg font-semibold text-slate-950">{meeting?.title || 'Untitled room'}</h1>
                <p className="text-xs text-slate-500">ID: {meetingId}</p>
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
                  className="button-secondary px-4 py-2 text-sm"
                >
                  Copy invite link
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="button-primary px-4 py-2 text-sm"
                >
                  Leave
                </button>
              </div>
            </div>

            <div className="relative" style={{ height: 'calc(100vh - 11rem)' }}>
              <JitsiMeeting
                roomName={meetingId}
                displayName={userDisplayName}
                userEmail={userEmail}
                jwt={jwt || undefined}
                height="100%"
                onApiReady={handleApiReady}
                onReadyToClose={handleMeetingClose}
              />
            </div>
          </div>

          <aside className="w-full shrink-0 space-y-4 lg:w-[380px]">
            <div className="surface rounded-[2rem] p-4">
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className={`pill ${meeting?.isPrivate ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}`}>
                  {meeting?.isPrivate ? 'Private room' : 'Public room'}
                </span>
                <span className="pill">
                  {meeting?.chatEnabled ? 'Chat stored' : 'Chat off'}
                </span>
                <span className="pill">
                  {meeting?.recordingEnabled ? 'Recording ready' : 'Recording off'}
                </span>
              </div>
              <p className="mb-2 text-sm text-slate-500">Host</p>
              <p className="truncate font-medium text-slate-950">{meeting?.hostEmail || userEmail}</p>
              {meeting?.description && <p className="mt-3 text-sm leading-6 text-slate-500">{meeting.description}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleRecordingToggle}
                  className="button-secondary flex-1 border-amber-200 bg-amber-50 text-amber-700"
                >
                  {isRecording ? 'Stop recording' : 'Start recording'}
                </button>
              </div>
            </div>

            <div className="surface rounded-[2rem] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="section-kicker">Chat storage</h2>
                <span className="pill">{messages.length} messages</span>
              </div>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {messages.length > 0 ? messages.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-900">{item.senderName}</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="break-words text-sm text-slate-600">{item.message}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No chat messages stored yet.</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder={meeting?.chatEnabled ? 'Write a message...' : 'Chat is disabled'}
                  disabled={!meeting?.chatEnabled}
                  className="input-modern flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={!meeting?.chatEnabled || isSending}
                  className="button-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="surface rounded-[2rem] p-4">
              <h2 className="section-kicker mb-3">Meeting history</h2>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {activity.length > 0 ? activity.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <p className="text-sm font-medium capitalize text-slate-950">{item.type.replace('-', ' ')}</p>
                    <p className="text-xs text-slate-500">{item.userName} · {new Date(item.createdAt).toLocaleString()}</p>
                    {item.details && <p className="mt-1 truncate text-xs text-slate-500">{item.details}</p>}
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No activity yet.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {copyStatus && (
        <div className="fixed top-20 right-4 z-30 rounded-lg bg-emerald-500/90 text-white px-4 py-2 shadow-lg">
          {copyStatus}
        </div>
      )}
    </div>
  );
}
