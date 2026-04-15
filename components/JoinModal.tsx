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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    if (!meetingId.trim()) {
      setError('Please enter a meeting ID');
      setIsJoining(false);
      return;
    }

    try {
      // Verify meeting exists
      const response = await fetch(`/api/get-meeting?id=${meetingId}`);
      
      if (!response.ok) {
        setError('Meeting not found');
        setIsJoining(false);
        return;
      }

      setIsJoining(false);
      router.push(`/room/${meetingId}`);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="backdrop-blur-md bg-slate-800/90 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Join Meeting</h2>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Meeting ID
            </label>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter meeting ID"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isJoining}
              className="flex-1 px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isJoining}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
