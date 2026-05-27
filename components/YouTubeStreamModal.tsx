'use client';

import { useState } from 'react';

interface YouTubeStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (streamUrl: string) => Promise<void>;
  loading?: boolean;
}

export function YouTubeStreamModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: YouTubeStreamModalProps) {
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!streamUrl.trim()) {
      setError('Stream URL is required');
      return;
    }

    if (!streamUrl.includes('rtmps') && !streamUrl.includes('youtube')) {
      setError('Invalid YouTube stream URL (must contain rtmps or youtube)');
      return;
    }

    try {
      await onSubmit(streamUrl);
      setStreamUrl('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md mx-4 rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Go Live on YouTube</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  YouTube Stream URL
                </label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="rtmps://a.rtmp.youtube.com/live2/your-stream-key"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Get your stream URL from YouTube Studio &gt; Go Live &gt; Stream settings
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
                >
                  {loading ? 'Starting...' : 'Go Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
