'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

const MIME_TYPE_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=opus',
  'video/webm',
];

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  return MIME_TYPE_CANDIDATES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
}

function sanitizeFilePart(value: string) {
  return String(value || 'meeting')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'meeting';
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function postRecordingActivity(
  meetingId: string,
  type: 'recording-started' | 'recording-stopped',
  details: string
) {
  if (!meetingId) {
    return;
  }

  try {
    await fetch('/api/meeting-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, type, details }),
    });
  } catch {
    // Local recording should not fail because activity tracking is unavailable.
  }
}

/**
 * Records the meeting locally in the browser and downloads a WebM file.
 */
export function useRecording(roomName: string): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    recordingId: null,
    error: null,
    loading: false,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeRoomRef = useRef(roomName);
  const recordingIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeRoomRef.current = roomName;
  }, [roomName]);

  const cleanupStreams = useCallback(() => {
    stopStream(displayStreamRef.current);
    stopStream(microphoneStreamRef.current);
    stopStream(mixedStreamRef.current);

    displayStreamRef.current = null;
    microphoneStreamRef.current = null;
    mixedStreamRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }, []);

  const stopRecording = useCallback(
    async () => {
      const recorder = recorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        cleanupStreams();
        recorderRef.current = null;
        recordingIdRef.current = null;
        setState((prev) => ({
          ...prev,
          isRecording: false,
          recordingId: null,
          loading: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));
      recorder.stop();
    },
    [cleanupStreams]
  );

  const startRecording = useCallback(
    async (room: string = roomName) => {
      const resolvedRoom = room || activeRoomRef.current;

      if (!resolvedRoom) {
        setState((prev) => ({ ...prev, error: 'Room name is required' }));
        return;
      }

      if (recorderRef.current?.state === 'recording') {
        return;
      }

      if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
        setState((prev) => ({
          ...prev,
          error: 'Local recording is not supported in this browser',
        }));
        return;
      }

      if (!navigator.mediaDevices?.getDisplayMedia) {
        setState((prev) => ({
          ...prev,
          error: 'Screen or tab capture is not supported in this browser',
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: 30, max: 30 },
          },
          audio: true,
        } as DisplayMediaStreamOptions);

        let microphoneStream: MediaStream | null = null;
        try {
          microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
        } catch {
          microphoneStream = null;
        }

        const outputTracks = [...displayStream.getVideoTracks()];
        const audioStreams = [displayStream, microphoneStream].filter(
          (stream): stream is MediaStream => Boolean(stream?.getAudioTracks().length)
        );

        if (audioStreams.length > 0 && typeof AudioContext !== 'undefined') {
          const audioContext = new AudioContext();
          const destination = audioContext.createMediaStreamDestination();

          audioStreams.forEach((stream) => {
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(destination);
          });

          outputTracks.push(...destination.stream.getAudioTracks());
          audioContextRef.current = audioContext;
        } else {
          outputTracks.push(...displayStream.getAudioTracks());
          outputTracks.push(...(microphoneStream?.getAudioTracks() || []));
        }

        const mixedStream = new MediaStream(outputTracks);
        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(
          mixedStream,
          mimeType ? { mimeType } : undefined
        );
        const recordingId = `${sanitizeFilePart(resolvedRoom)}-${Date.now()}`;

        chunksRef.current = [];
        displayStreamRef.current = displayStream;
        microphoneStreamRef.current = microphoneStream;
        mixedStreamRef.current = mixedStream;
        recorderRef.current = recorder;
        recordingIdRef.current = recordingId;
        activeRoomRef.current = resolvedRoom;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          setState((prev) => ({
            ...prev,
            error: 'Recording failed. Please start a new local recording.',
            loading: false,
          }));
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mimeType || 'video/webm',
          });
          const fileName = `melanam-${recordingId}.webm`;

          if (blob.size > 0) {
            downloadBlob(blob, fileName);
            void postRecordingActivity(
              resolvedRoom,
              'recording-stopped',
              `Local recording saved as ${fileName}`
            );
          }

          chunksRef.current = [];
          cleanupStreams();
          recorderRef.current = null;
          recordingIdRef.current = null;

          setState((prev) => ({
            ...prev,
            isRecording: false,
            recordingId: null,
            loading: false,
            error: blob.size > 0 ? null : 'No recording data was captured',
          }));
        };

        displayStream.getTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            if (recorderRef.current?.state === 'recording') {
              void stopRecording();
            }
          });
        });

        recorder.start(1000);

        setState((prev) => ({
          ...prev,
          isRecording: true,
          recordingId,
          loading: false,
          error: null,
        }));

        void postRecordingActivity(
          resolvedRoom,
          'recording-started',
          'Local browser recording started'
        );
      } catch (error) {
        cleanupStreams();
        recorderRef.current = null;
        recordingIdRef.current = null;

        const errorMessage =
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Recording permission was cancelled'
            : error instanceof Error
              ? error.message
              : 'Failed to start local recording';

        setState((prev) => ({
          ...prev,
          isRecording: false,
          recordingId: null,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [cleanupStreams, roomName, stopRecording]
  );

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      } else {
        cleanupStreams();
      }
    };
  }, [cleanupStreams]);

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
