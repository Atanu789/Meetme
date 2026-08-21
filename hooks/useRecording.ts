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
  stopRecording: (roomName?: string) => Promise<void>;
  clearError: () => void;
}

type RecordingProfile = {
  mimeType: string;
  width: number;
  height: number;
  label: string;
};

type RecordingFileExtension = 'webm' | 'mp4' | 'ogg' | 'mkv';

const RECORDER_CHUNK_INTERVAL_MS = 1000;
const STOP_FALLBACK_TIMEOUT_MS = 7000;
const DEFAULT_RECORDING_MIME_TYPE = 'video/webm';
const MAX_RECORDING_WIDTH = 1920;
const MAX_RECORDING_HEIGHT = 1080;
const MAX_RECORDING_FRAME_RATE = 30;
const HIGH_QUALITY_VIDEO_BITS_PER_SECOND = 8_000_000;
const HIGH_QUALITY_AUDIO_BITS_PER_SECOND = 192_000;
const MOBILE_VIDEO_BITS_PER_SECOND = 2_500_000;
const MOBILE_AUDIO_BITS_PER_SECOND = 96_000;

const RECORDING_PROFILES: RecordingProfile[] = [
  {
    mimeType: 'video/webm;codecs=vp9,opus',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p VP9',
  },
  {
    mimeType: 'video/webm;codecs=vp8,opus',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p VP8',
  },
  {
    mimeType: 'video/webm',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p WebM',
  },
  {
    mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p H.264 Baseline',
  },
  {
    mimeType: 'video/mp4;codecs=h264,aac',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p H.264',
  },
  {
    mimeType: 'video/mp4',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p MP4',
  },
  {
    mimeType: 'video/ogg;codecs=theora,opus',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p Ogg Theora',
  },
  {
    mimeType: 'video/ogg',
    width: MAX_RECORDING_WIDTH,
    height: MAX_RECORDING_HEIGHT,
    label: '1080p Ogg',
  },
];

function isTypeSupported(mimeType: string) {
  try {
    return (
      typeof MediaRecorder !== 'undefined' &&
      typeof MediaRecorder.isTypeSupported === 'function' &&
      MediaRecorder.isTypeSupported(mimeType)
    );
  } catch {
    return false;
  }
}

function isMobileBrowser() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgentData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (userAgentData?.mobile) {
    return true;
  }

  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function getSupportedProfiles() {
  if (typeof MediaRecorder === 'undefined') {
    return [];
  }

  return RECORDING_PROFILES.filter((profile) => isTypeSupported(profile.mimeType));
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

function isCapturePermissionError(error: unknown) {
  return (
    error instanceof DOMException &&
    ['AbortError', 'InvalidStateError', 'NotAllowedError', 'NotFoundError', 'SecurityError'].includes(error.name)
  );
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
  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  } catch (error) {
    if (isCapturePermissionError(error)) {
      throw error;
    }

    // Some browsers reject system-audio capture constraints. Retry with video-only
    // so recording still works when tab/system audio is unavailable.
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
  }

  const [videoTrack] = stream.getVideoTracks();
  if (videoTrack?.applyConstraints) {
    try {
      await videoTrack.applyConstraints({
        width: { ideal: profile.width },
        height: { ideal: profile.height },
        frameRate: {
          ideal: MAX_RECORDING_FRAME_RATE,
          max: MAX_RECORDING_FRAME_RATE,
        },
      });
    } catch {
      // Keep the browser-approved capture if quality constraints cannot be applied.
    }
  }

  return stream;
}

function createMediaRecorder(stream: MediaStream) {
  const supportedProfiles = getSupportedProfiles();
  const mobileBrowser = isMobileBrowser();
  const videoBitsPerSecond = mobileBrowser
    ? MOBILE_VIDEO_BITS_PER_SECOND
    : HIGH_QUALITY_VIDEO_BITS_PER_SECOND;
  const audioBitsPerSecond = mobileBrowser
    ? MOBILE_AUDIO_BITS_PER_SECOND
    : HIGH_QUALITY_AUDIO_BITS_PER_SECOND;

  for (const profile of supportedProfiles) {
    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: profile.mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond,
      });
      const mimeType = recorder.mimeType || profile.mimeType;

      return {
        recorder,
        mimeType,
        profile,
      };
    } catch {
      // Some browsers accept a MIME type but reject explicit bitrate options.
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType: profile.mimeType });
      const mimeType = recorder.mimeType || profile.mimeType;

      return {
        recorder,
        mimeType,
        profile,
      };
    } catch {
      // Try the next browser-supported profile.
    }
  }

  let recorder: MediaRecorder;

  try {
    recorder = new MediaRecorder(stream, {
      videoBitsPerSecond,
      audioBitsPerSecond,
    });
  } catch {
    recorder = new MediaRecorder(stream);
  }

  const mimeType = recorder.mimeType || DEFAULT_RECORDING_MIME_TYPE;

  return {
    recorder,
    mimeType,
    profile: {
      mimeType,
      width: MAX_RECORDING_WIDTH,
      height: MAX_RECORDING_HEIGHT,
      label: 'Browser default 1080p',
    } satisfies RecordingProfile,
  };
}

function extensionForMimeType(mimeType: string): RecordingFileExtension {
  const normalizedMimeType = String(mimeType || '').toLowerCase();

  if (normalizedMimeType.includes('mp4') || normalizedMimeType.includes('quicktime')) {
    return 'mp4';
  }

  if (normalizedMimeType.includes('ogg')) {
    return 'ogg';
  }

  if (normalizedMimeType.includes('matroska') || normalizedMimeType.includes('mkv')) {
    return 'mkv';
  }

  return 'webm';
}

async function requestMicrophoneStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
  } catch {
    // Microphone permission is optional: keep recording the shared screen.
    return null;
  }
}

function getAudioContextConstructor() {
  return window.AudioContext || (window as any).webkitAudioContext;
}

function disconnectAudioNodes(nodes: MediaStreamAudioSourceNode[]) {
  nodes.forEach((node) => {
    try {
      node.disconnect();
    } catch {
      // Ignore already-disconnected nodes during browser shutdown races.
    }
  });
}

async function createMixedRecordingStream(
  displayStream: MediaStream,
  microphoneStream: MediaStream | null
) {
  const videoTracks = displayStream.getVideoTracks();
  if (videoTracks.length === 0) {
    throw new Error('No screen video track was captured');
  }

  const audioStreams = [displayStream, microphoneStream].filter(
    (stream): stream is MediaStream => Boolean(stream?.getAudioTracks().length)
  );

  if (audioStreams.length === 0) {
    return {
      stream: new MediaStream(videoTracks),
      audioContext: null as AudioContext | null,
      sourceNodes: [] as MediaStreamAudioSourceNode[],
    };
  }

  // Mixing through an AudioContext is unnecessary for a single track and is
  // fragile on iOS when the page is backgrounded. Preserve that track exactly
  // as the browser supplied it.
  if (audioStreams.length === 1) {
    return {
      stream: new MediaStream([...videoTracks, ...audioStreams[0].getAudioTracks()]),
      audioContext: null as AudioContext | null,
      sourceNodes: [] as MediaStreamAudioSourceNode[],
    };
  }

  const AudioContextCtor = getAudioContextConstructor();

  if (AudioContextCtor) {
    try {
      const audioContext = new AudioContextCtor();
      const destination = audioContext.createMediaStreamDestination();
      const sourceNodes = audioStreams.map((stream) => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(destination);
        return source;
      });

      if (audioContext.state === 'suspended') {
        await audioContext.resume().catch(() => undefined);
      }

      return {
        stream: new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]),
        audioContext,
        sourceNodes,
      };
    } catch (error) {
      console.warn('[recording] AudioContext mix failed; falling back to one audio track', error);
    }
  }

  // If audio mixing is unavailable, keep one browser-approved audio track.
  // Multiple direct audio tracks are not consistently encoded by MediaRecorder.
  const [firstAudioTrack] = audioStreams.flatMap((stream) => stream.getAudioTracks());
  return {
    stream: new MediaStream(firstAudioTrack ? [...videoTracks, firstAudioTrack] : videoTracks),
    audioContext: null as AudioContext | null,
    sourceNodes: [] as MediaStreamAudioSourceNode[],
  };
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
  const audioSourceNodesRef = useRef<MediaStreamAudioSourceNode[]>([]);
  const activeRoomRef = useRef(roomName);
  const recordingIdRef = useRef<string | null>(null);
  const recordingStartedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingFinalizedRef = useRef(false);
  const recordingMimeTypeRef = useRef(DEFAULT_RECORDING_MIME_TYPE);

  useEffect(() => {
    activeRoomRef.current = roomName;
  }, [roomName]);

  const cleanupStreams = useCallback(() => {
    disconnectAudioNodes(audioSourceNodesRef.current);
    audioSourceNodesRef.current = [];

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

  const clearStopFallbackTimer = useCallback(() => {
    if (stopFallbackTimerRef.current) {
      clearTimeout(stopFallbackTimerRef.current);
      stopFallbackTimerRef.current = null;
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

  const finalizeRecording = useCallback(
    (meetingId?: string, errorMessage?: string) => {
      if (recordingFinalizedRef.current) {
        return;
      }

      recordingFinalizedRef.current = true;
      clearStopFallbackTimer();
      stopTimer();

      const resolvedRoom = meetingId || activeRoomRef.current;
      const durationSeconds = Math.max(
        0,
        Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)
      );
      const recordingDuration = formatDuration(durationSeconds);
      const recordingDate = formatLocalDate(new Date());
      const mimeType =
        recorderRef.current?.mimeType ||
        recordingMimeTypeRef.current ||
        chunksRef.current.find((chunk) => chunk.type)?.type ||
        DEFAULT_RECORDING_MIME_TYPE;
      const extension = extensionForMimeType(mimeType);
      const blob = new Blob(chunksRef.current, {
        type: mimeType,
      });
      const fileName = `Melanam-Meeting-${formatLocalDateTimeForFile(new Date())}.${extension}`;

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
      recorderRef.current = null;
      recordingIdRef.current = null;
      cleanupStreams();

      setState((prev) => ({
        ...prev,
        isRecording: false,
        recordingId: null,
        loading: false,
        elapsedSeconds: 0,
        elapsedTime: '00:00',
        error: errorMessage || (blob.size > 0 ? null : 'No recording data was captured'),
      }));
    },
    [cleanupStreams, clearStopFallbackTimer, stopTimer]
  );

  const scheduleStopFallback = useCallback(
    (meetingId?: string) => {
      clearStopFallbackTimer();
      stopFallbackTimerRef.current = setTimeout(() => {
        stopFallbackTimerRef.current = null;
        finalizeRecording(meetingId);
      }, STOP_FALLBACK_TIMEOUT_MS);
    },
    [clearStopFallbackTimer, finalizeRecording]
  );

  const stopRecording = useCallback(
    async (room?: string) => {
      const recorder = recorderRef.current;
      const resolvedRoom = room || activeRoomRef.current;

      if (!recorder) {
        finalizeRecording(resolvedRoom);
        return;
      }

      if (recorder.state === 'inactive') {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        scheduleStopFallback(resolvedRoom);
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        recorder.requestData();
      } catch {
        // Safari and Firefox can reject requestData while the recorder is stopping.
      }

      scheduleStopFallback(resolvedRoom);

      try {
        recorder.stop();
      } catch (error) {
        console.warn('[recording] stop failed; finalizing available data', error);
        finalizeRecording(resolvedRoom);
      }
    },
    [finalizeRecording, scheduleStopFallback]
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
          error: 'Screen recording is not available in this mobile browser. Use a current Android Chrome browser or desktop browser.',
        }));
        return;
      }

      try {
        // Keep getDisplayMedia first in the async path. Safari/Firefox are strict
        // about transient user activation and can reject capture after awaits/prompts.
        const baseProfile = getSupportedProfiles()[0] || RECORDING_PROFILES[0];
        const preferredProfile = isMobileBrowser()
          ? { ...baseProfile, width: 1280, height: 720, label: '720p mobile capture' }
          : baseProfile;
        const displayStream = await requestDisplayStream(preferredProfile);
        displayStreamRef.current = displayStream;

        setState((prev) => ({ ...prev, loading: true, error: null }));

        await postLocalRecording(resolvedRoom, 'check');

        const microphoneStream = await requestMicrophoneStream();
        const mixed = await createMixedRecordingStream(displayStream, microphoneStream);
        let mixedStream = mixed.stream;
        let recorderSetup: ReturnType<typeof createMediaRecorder>;

        try {
          recorderSetup = createMediaRecorder(mixedStream);
        } catch (error) {
          if (mixedStream.getAudioTracks().length === 0) {
            throw error;
          }

          console.warn('[recording] recorder rejected audio tracks; falling back to video-only', error);
          mixedStream = new MediaStream(mixedStream.getVideoTracks());
          recorderSetup = createMediaRecorder(mixedStream);
        }

        const { recorder, mimeType } = recorderSetup;
        const recordingId = `${sanitizeFilePart(resolvedRoom)}-${Date.now()}`;

        chunksRef.current = [];
        recordingFinalizedRef.current = false;
        microphoneStreamRef.current = microphoneStream;
        mixedStreamRef.current = mixedStream;
        audioContextRef.current = mixed.audioContext;
        audioSourceNodesRef.current = mixed.sourceNodes;
        recorderRef.current = recorder;
        recordingIdRef.current = recordingId;
        activeRoomRef.current = resolvedRoom;
        recordingMimeTypeRef.current = recorder.mimeType || mimeType || DEFAULT_RECORDING_MIME_TYPE;

        recorder.ondataavailable = (event) => {
          if (!recordingFinalizedRef.current && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = (event) => {
          console.warn('[recording] recorder error', event);
          finalizeRecording(resolvedRoom, 'Recording failed. Please start a new local recording.');
        };

        recorder.onstop = () => {
          finalizeRecording(resolvedRoom);
        };

        displayStream.getVideoTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            if (recorderRef.current && !recordingFinalizedRef.current) {
              void stopRecording(resolvedRoom);
            }
          });
        });

        try {
          recorder.start(RECORDER_CHUNK_INTERVAL_MS);
        } catch {
          recorder.start();
        }
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
        clearStopFallbackTimer();
        recordingFinalizedRef.current = true;
        stopTimer();
        cleanupStreams();
        recorderRef.current = null;
        recordingIdRef.current = null;

        const errorMessage =
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Recording cancelled.'
            : error instanceof DOMException && ['NotSupportedError', 'TypeError'].includes(error.name)
              ? 'Screen recording is not supported by this browser. Use a current Android Chrome browser or desktop browser.'
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
    [cleanupStreams, clearStopFallbackTimer, finalizeRecording, roomName, startTimer, stopRecording, stopTimer]
  );

  useEffect(() => {
    return () => {
      clearStopFallbackTimer();
      if (recorderRef.current?.state === 'recording') {
        try {
          recorderRef.current.requestData();
        } catch {
          // Ignore shutdown races while navigating away.
        }

        try {
          recorderRef.current.stop();
        } catch {
          cleanupStreams();
        }
      } else {
        cleanupStreams();
      }
      stopTimer();
    };
  }, [cleanupStreams, clearStopFallbackTimer, stopTimer]);

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
