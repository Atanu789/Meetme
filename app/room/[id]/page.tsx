'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/Loader';
import { JitsiMeeting } from '@/components/JitsiMeeting';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [copyStatus, setCopyStatus] = useState('');
  const [meetingError, setMeetingError] = useState('');

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
    <div className="w-full h-screen bg-slate-900 relative">
      <JitsiMeeting
        roomName={meetingId}
        displayName={userDisplayName}
        userEmail={userEmail}
        height="100%"
        onReadyToClose={() => router.push('/dashboard')}
      />
      
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
    </div>
  );
}
