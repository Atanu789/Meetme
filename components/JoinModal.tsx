'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinModal({ isOpen, onClose }: JoinModalProps) {
  const [meetingId, setMeetingId] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const normalizeMeetingId = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // Accept full invite links like http://localhost:3000/room/abc123
    try {
      const parsed = new URL(trimmed);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const roomIndex = parts.findIndex((part) => part === 'room');
      if (roomIndex >= 0 && parts[roomIndex + 1]) {
        return decodeURIComponent(parts[roomIndex + 1]);
      }
    } catch {
      // Not a URL, treat as direct meeting id.
    }

    return trimmed;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    const normalizedMeetingId = normalizeMeetingId(meetingId);

    if (!normalizedMeetingId) {
      setError('Please enter a meeting ID');
      setIsJoining(false);
      return;
    }

    try {
      // Verify meeting exists
      const response = await fetch(
        `/api/get-meeting?id=${encodeURIComponent(normalizedMeetingId)}`
      );
      
      if (!response.ok) {
        setError('Meeting not found');
        setIsJoining(false);
        return;
      }

      setIsJoining(false);
      router.push(`/room/${encodeURIComponent(normalizedMeetingId)}`);
      setMeetingId('');
      onClose();
    } catch (err) {
      setError('Failed to join meeting');
      setIsJoining(false);
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="surface-strong w-full max-w-md rounded-3xl p-6">
        <div className="mb-6">
          <p className="section-kicker mb-2">Join room</p>
          <h2 className="font-display text-2xl font-semibold text-slate-950">Enter a meeting link or ID</h2>
          <p className="mt-2 text-sm text-slate-500">You can paste a full invite URL or just the room code.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Meeting ID
            </label>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter meeting ID"
              className="input-modern"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isJoining}
              className="button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isJoining}
              className="button-primary flex-1"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
