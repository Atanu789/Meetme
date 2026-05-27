'use client';

import { useState, useCallback } from 'react';

export interface LivestreamState {
  isStreaming: boolean;
  streamId: string | null;
  error: string | null;
  loading: boolean;
}

export interface UseLivestreamReturn extends LivestreamState {
  startLivestream: (roomName: string, youtubeStreamUrl: string) => Promise<void>;
  stopLivestream: (roomName: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing YouTube livestream via Jibri
 * 
 * @param roomName - The Jitsi room name
 * @returns Livestream state and control methods
 * 
 * @example
 * ```tsx
 * const { isStreaming, startLivestream, stopLivestream } = useLivestream(roomName);
 * 
 * const handleStartStream = async () => {
 *   const streamUrl = 'rtmps://a.rtmp.youtube.com/live2/your-key';
 *   await startLivestream(roomName, streamUrl);
 * };
 * 
 * return (
 *   <>
 *     {isStreaming && <span>Streaming to YouTube...</span>}
 *     <button onClick={handleStartStream}>Go Live</button>
 *     <button onClick={() => stopLivestream(roomName)}>Stop Stream</button>
 *   </>
 * );
 * ```
 */
export function useLivestream(roomName: string): UseLivestreamReturn {
  const [state, setState] = useState<LivestreamState>({
    isStreaming: false,
    streamId: null,
    error: null,
    loading: false,
  });

  const startLivestream = useCallback(
    async (room: string = roomName, youtubeStreamUrl: string) => {
      if (!room) {
        setState((prev) => ({ ...prev, error: 'Room name is required' }));
        return;
      }

      if (!youtubeStreamUrl) {
        setState((prev) => ({ ...prev, error: 'YouTube stream URL is required' }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/livestream/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            roomName: room,
            youtubeStreamUrl,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to start livestream');
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          isStreaming: true,
          streamId: data.streamId,
          loading: false,
          error: null,
        }));
        console.log('[Livestream] Started:', data.streamId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          loading: false,
          error: errorMessage,
        }));
        console.error('[Livestream] Error:', errorMessage);
      }
    },
    [roomName]
  );

  const stopLivestream = useCallback(
    async (room: string = roomName) => {
      if (!room) {
        setState((prev) => ({ ...prev, error: 'Room name is required' }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/livestream/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: room }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to stop livestream');
        }

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          streamId: null,
          loading: false,
          error: null,
        }));
        console.log('[Livestream] Stopped');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        console.error('[Livestream] Error:', errorMessage);
      }
    },
    [roomName]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startLivestream,
    stopLivestream,
    clearError,
  };
}
