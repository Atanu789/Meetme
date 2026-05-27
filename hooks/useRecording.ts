'use client';

import { useState, useCallback } from 'react';

export interface RecordingState {
  isRecording: boolean;
  recordingId: string | null;
  error: string | null;
  loading: boolean;
}

export interface UseRecordingReturn extends RecordingState {
  startRecording: (roomName: string) => Promise<void>;
  stopRecording: (roomName: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing Jibri recording
 * 
 * @param roomName - The Jitsi room name
 * @returns Recording state and control methods
 * 
 * @example
 * ```tsx
 * const { isRecording, startRecording, stopRecording } = useRecording(roomName);
 * 
 * return (
 *   <>
 *     {isRecording && <span>Recording in progress...</span>}
 *     <button onClick={() => startRecording(roomName)}>Start</button>
 *     <button onClick={() => stopRecording(roomName)}>Stop</button>
 *   </>
 * );
 * ```
 */
export function useRecording(roomName: string): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    recordingId: null,
    error: null,
    loading: false,
  });

  const startRecording = useCallback(
    async (room: string = roomName) => {
      if (!room) {
        setState((prev) => ({ ...prev, error: 'Room name is required' }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/recording/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: room }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to start recording');
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          isRecording: true,
          recordingId: data.recordingId,
          loading: false,
          error: null,
        }));
        console.log('[Recording] Started:', data.recordingId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isRecording: false,
          loading: false,
          error: errorMessage,
        }));
        console.error('[Recording] Error:', errorMessage);
      }
    },
    [roomName]
  );

  const stopRecording = useCallback(
    async (room: string = roomName) => {
      if (!room) {
        setState((prev) => ({ ...prev, error: 'Room name is required' }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/recording/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: room }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to stop recording');
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          isRecording: false,
          recordingId: null,
          loading: false,
          error: null,
        }));
        console.log('[Recording] Stopped');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        console.error('[Recording] Error:', errorMessage);
      }
    },
    [roomName]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearError,
  };
}
