'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface RecordingState {
  isRecording: boolean;
  recordingId: string | null;
  error: string | null;
  loading: boolean;
  elapsedSeconds: number;
  elapsedTime: string;
}

export interface UseRecordingReturn extends RecordingState {
  startRecording: (roomName: string) => Promise<void>;
  stopRecording: (roomName: string) => Promise<void>;
  clearError: () => void;
}

type RecordingProfile = {
  mimeType: string;
  extension: 'webm' | 'mp4';
  width: number;
  height: number;
  label: string;
};

const RECORDING_PROFILES: RecordingProfile[] = [
  {
    mimeType: 'video/webm;codecs=vp9,opus',
    extension: 'webm',
    width: 1920,
    height: 1080,
    label: '1080p VP9',
  },
  {
    mimeType: 'video/webm;codecs=vp8,opus',
    extension: 'webm',
    width: 1280,
    height: 720,
    label: '720p VP8',
  },
  {
    mimeType: 'video/webm',
    extension: 'webm',
    width: 1280,
    height: 720,
    label: '720p WebM',
  },
  {
    mimeType: 'video/mp4;codecs=h264,aac',
    extension: 'mp4',
    width: 1280,
    height: 720,
    label: '720p H.264',
  },
  {
    mimeType: 'video/mp4',
    extension: 'mp4',
    width: 1280,
    height: 720,
    label: '720p MP4',
  },
];

function getSupportedProfiles() {
  if (typeof MediaRecorder === 'undefined') {
    return [];
  }

  return RECORDING_PROFILES.filter((profile) => MediaRecorder.isTypeSupported(profile.mimeType));
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

async function requestDisplayStream(profile: RecordingProfile) {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  const [videoTrack] = stream.getVideoTracks();
  if (videoTrack?.applyConstraints) {
    try {
      await videoTrack.applyConstraints({
        width: { ideal: profile.width },
        height: { ideal: profile.height },
        frameRate: { ideal: 30, max: 30 },
      });
    } catch {
      // Keep the browser-approved capture if quality constraints cannot be applied.
    }
  }

  return stream;
}

function createMediaRecorder(stream: MediaStream) {
  const supportedProfiles = getSupportedProfiles();

  for (const profile of supportedProfiles) {
    try {
      return {
        recorder: new MediaRecorder(stream, { mimeType: profile.mimeType }),
        profile,
      };
    } catch {
      // Try the next browser-supported profile.
    }
  }

  const recorder = new MediaRecorder(stream);
  const mimeType = recorder.mimeType || 'video/webm';

  return {
    recorder,
    profile: {
      mimeType,
      extension: extensionForMimeType(mimeType),
      width: 1280,
      height: 720,
      label: 'Browser default',
    } satisfies RecordingProfile,
  };
}

function extensionForMimeType(mimeType: string): 'webm' | 'mp4' {
  return mimeType.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

async function postLocalRecording(
  meetingId: string,
  action: 'check' | 'started' | 'completed',
  metadata?: {
    durationSeconds?: number;
    recordingDuration?: string;
    recordingDate?: string;
  }
) {
  if (!meetingId) {
    throw new Error('Room name is required');
  }

  const response = await fetch('/api/recording/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meetingId,
      action,
      ...metadata,
    }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.error || 'Recording permission failed');
  }

  return body;
}

function formatElapsedTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return [hours, minutes, remainingSeconds]
      .map((part) => String(part).padStart(2, '0'))
      .join(':');
  }

  return [minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatLocalDateTimeForFile(value: Date) {
  const date = formatLocalDate(value);
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');

  return `${date}-${hours}-${minutes}`;
}

/**
 * Records the meeting locally in the browser and stores metadata only.
 */
export function useRecording(roomName: string): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    recordingId: null,
    error: null,
    loading: false,
    elapsedSeconds: 0,
    elapsedTime: '00:00',
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeRoomRef = useRef(roomName);
  const recordingIdRef = useRef<string | null>(null);
  const recordingStartedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingFileExtensionRef = useRef<'webm' | 'mp4'>('webm');
  const recordingMimeTypeRef = useRef('video/webm');

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

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    recordingStartedAtRef.current = Date.now();

    const updateElapsed = () => {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)
      );

      setState((prev) => ({
        ...prev,
        elapsedSeconds,
        elapsedTime: formatElapsedTime(elapsedSeconds),
      }));
    };

    updateElapsed();
    timerRef.current = setInterval(updateElapsed, 1000);
  }, [stopTimer]);

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
          elapsedSeconds: 0,
          elapsedTime: '00:00',
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

      try {
        const acceptedWarning = window.confirm([
          'Recording is saved only after you click Stop Recording.',
          '',
          'Closing the browser before stopping will lose the recording.',
        ].join('\n'));

        if (!acceptedWarning) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Recording cancelled.',
          }));
          return;
        }

        const preferredProfile = getSupportedProfiles()[0] || RECORDING_PROFILES[1];
        const displayStream = await requestDisplayStream(preferredProfile);
        displayStreamRef.current = displayStream;

        setState((prev) => ({ ...prev, loading: true, error: null }));

        await postLocalRecording(resolvedRoom, 'check');

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

        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (audioStreams.length > 0 && AudioContextCtor) {
          const audioContext = new AudioContextCtor();
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
        const { recorder, profile } = createMediaRecorder(mixedStream);
        const recordingId = `${sanitizeFilePart(resolvedRoom)}-${Date.now()}`;

        chunksRef.current = [];
        microphoneStreamRef.current = microphoneStream;
        mixedStreamRef.current = mixedStream;
        recorderRef.current = recorder;
        recordingIdRef.current = recordingId;
        activeRoomRef.current = resolvedRoom;
        recordingFileExtensionRef.current = profile.extension;
        recordingMimeTypeRef.current = recorder.mimeType || profile.mimeType || 'video/webm';

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
          stopTimer();
          const durationSeconds = Math.max(
            0,
            Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)
          );
          const recordingDuration = formatDuration(durationSeconds);
          const recordingDate = formatLocalDate(new Date());
          const blob = new Blob(chunksRef.current, {
            type: recordingMimeTypeRef.current,
          });
          const fileName = `Melanam-Meeting-${formatLocalDateTimeForFile(new Date())}.${recordingFileExtensionRef.current}`;

          if (blob.size > 0) {
            downloadBlob(blob, fileName);
            void postLocalRecording(resolvedRoom, 'completed', {
              durationSeconds,
              recordingDuration,
              recordingDate,
            }).catch((error) => {
              console.warn('[recording] metadata save failed', error);
            });
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
            elapsedSeconds: 0,
            elapsedTime: '00:00',
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

        recorder.start();
        startTimer();

        setState((prev) => ({
          ...prev,
          isRecording: true,
          recordingId,
          loading: false,
          error: null,
        }));

        void postLocalRecording(resolvedRoom, 'started').catch((error) => {
          console.warn('[recording] start metadata failed', error);
        });
      } catch (error) {
        stopTimer();
        cleanupStreams();
        recorderRef.current = null;
        recordingIdRef.current = null;

        const errorMessage =
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Recording cancelled.'
            : error instanceof Error
              ? error.message
              : 'Failed to start local recording';

        setState((prev) => ({
          ...prev,
          isRecording: false,
          recordingId: null,
          loading: false,
          elapsedSeconds: 0,
          elapsedTime: '00:00',
          error: errorMessage,
        }));
      }
    },
    [cleanupStreams, roomName, startTimer, stopRecording, stopTimer]
  );

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      } else {
        cleanupStreams();
      }
      stopTimer();
    };
  }, [cleanupStreams, stopTimer]);

  useEffect(() => {
    if (!state.isRecording) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isRecording]);

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
