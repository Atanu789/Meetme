'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveMeetingAiHttpUrl } from '@/lib/meeting-ai-client';

interface AudioCaptureProps {
  meetingId: string;
  enabled?: boolean;
  className?: string;
}

type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
};

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
};

type SpeechRecognitionErrorEvent = Event & {
  error?: string;
  message?: string;
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

export function AudioCapture({ meetingId, enabled = true, className }: AudioCaptureProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const lastCaptionTextRef = useRef('');
  const lastInterimSentAtRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postLiveCaption = async (text: string, final: boolean) => {
    const normalizedText = text.trim().replace(/\s+/g, ' ');

    if (!normalizedText || normalizedText === lastCaptionTextRef.current) {
      return;
    }

    if (!final && Date.now() - lastInterimSentAtRef.current < 250) {
      return;
    }

    if (!final) {
      lastInterimSentAtRef.current = Date.now();
    }

    lastCaptionTextRef.current = normalizedText;

    try {
      const baseUrl = resolveMeetingAiHttpUrl();
      const response = await fetch(`${baseUrl}/api/rooms/${encodeURIComponent(meetingId)}/captions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: normalizedText,
          speaker: 'You',
          speakerId: 'local-user',
          final,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.error('[audio] live caption post failed:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('[audio] live caption post error:', err);
    }
  };

  const uploadAudioChunk = async (blob: Blob) => {
    if (blob.size === 0) {
      console.log('[audio] Skipping empty audio chunk');
      return;
    }

    uploadQueueRef.current = uploadQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        console.log('[audio] Uploading audio chunk:', blob.size, 'bytes');
        const formData = new FormData();
        formData.append('audio', blob);
        formData.append('meetingId', meetingId);

        try {
          const response = await fetch('/api/transcribe-audio', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            console.error('[audio] transcribe failed:', response.status, response.statusText);
            const text = await response.text();
            console.error('[audio] Error response:', text);
          } else {
            const data = await response.json();
            console.log('[audio] Transcription successful:', data);
          }
        } catch (err) {
          console.error('[audio] upload error:', err);
        }
      });
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let resultIndex = event.resultIndex; resultIndex < event.results.length; resultIndex += 1) {
        const result = event.results[resultIndex];
        const transcript = result[0]?.transcript || '';

        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (finalText.trim()) {
        void postLiveCaption(finalText, true);
      } else if (interimText.trim()) {
        void postLiveCaption(interimText, false);
      }
    };

    recognition.onerror = (event) => {
      const message = event.error || event.message || 'Speech recognition error';
      console.warn('[audio] speech recognition error:', message);

      if (message !== 'no-speech') {
        setError(message);
      }
    };

    recognition.onend = () => {
      if (!shouldKeepListeningRef.current) {
        return;
      }

      try {
        recognition.start();
      } catch {
        setTimeout(() => {
          if (!shouldKeepListeningRef.current) {
            return;
          }

          try {
            recognition.start();
          } catch {
            // Leave the UI running; the user can restart manually if needed.
          }
        }, 300);
      }
    };

    try {
      recognition.start();
      speechRecognitionRef.current = recognition;
      return true;
    } catch (err) {
      console.warn('[audio] speech recognition failed to start:', err);
      speechRecognitionRef.current = null;
      return false;
    }
  };

  const startRecorderFallback = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('[audio] Microphone access granted, stream:', stream);
    streamRef.current = stream;

    const preferredMimeType = 'audio/webm;codecs=opus';
    const mediaRecorder = new MediaRecorder(
      stream,
      MediaRecorder.isTypeSupported(preferredMimeType) ? { mimeType: preferredMimeType } : undefined
    );

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size === 0) {
        return;
      }

      console.log('[audio] Got fixed audio chunk:', event.data.size, 'bytes');
      uploadAudioChunk(event.data);
    };

    mediaRecorder.start(3000);
    mediaRecorderRef.current = mediaRecorder;
    console.log('[audio] MediaRecorder fallback started');
  };

  const stopRecorderFallback = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startListening = async () => {
    try {
      console.log('[audio] Starting live captions');
      setError(null);
      shouldKeepListeningRef.current = true;
      lastCaptionTextRef.current = '';

      const speechStarted = startSpeechRecognition();
      if (!speechStarted) {
        console.log('[audio] SpeechRecognition unavailable; using recorder fallback');
        await startRecorderFallback();
      }

      setIsListening(true);
      console.log('[audio] Live captions started');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      console.error('[audio] Microphone error:', message);
      setError(message);
      shouldKeepListeningRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log('[audio] Stopping live captions');
    shouldKeepListeningRef.current = false;

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current.abort();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    stopRecorderFallback();
    setIsListening(false);
    console.log('[audio] Live captions stopped');
  };

  useEffect(() => {
    if (!enabled) return;

    return () => {
      stopListening();
    };
  }, [enabled]);

  const isEmbedded = Boolean(className);
  const wrapperClassName = className || 'fixed bottom-20 left-4 z-40 flex flex-col gap-2';
  const statusClassName = isEmbedded
    ? 'absolute left-0 top-11 z-50 min-w-max rounded px-3 py-1 text-xs shadow-lg'
    : 'rounded px-3 py-1 text-xs';

  return (
    <div className={wrapperClassName}>
      <button
        onClick={isListening ? stopListening : startListening}
        className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-all ${ isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600' }`}
        aria-label={isListening ? 'Stop captions' : 'Start captions'}
        title={isListening ? 'Stop captions' : 'Start captions'}
      >
        <div
          className={`h-2.5 w-2.5 rounded-full ${ isListening ? 'animate-pulse bg-white' : 'bg-white/50' }`}
        />
        {isListening ? 'Stop captions' : 'Start captions'}
      </button>

      {error && (
        <div className={`${statusClassName} bg-red-900/90 text-red-100`}>
          {error}
        </div>
      )}

      {isListening && (
        <div className={`${statusClassName} bg-blue-900/90 text-blue-100`}>
          Listening...
        </div>
      )}
    </div>
  );
}
