'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioCaptureProps {
  meetingId: string;
  enabled?: boolean;
}

export function AudioCapture({ meetingId, enabled = true }: AudioCaptureProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const silenceDetectorRef = useRef<NodeJS.Timeout | null>(null);

  const uploadAudioChunk = async (blob: Blob) => {
    if (blob.size === 0) {
      console.log('[audio] Skipping empty audio chunk');
      return;
    }

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
  };

  const startListening = async () => {
    try {
      console.log('[audio] Starting to listen for audio');
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[audio] Microphone access granted, stream:', stream);
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];
      let silenceTimeout: NodeJS.Timeout | null = null;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('[audio] Got data chunk:', event.data.size, 'bytes');
          chunksRef.current.push(event.data);

          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
          }

          silenceTimeout = setTimeout(() => {
            if (chunksRef.current.length > 0) {
              const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
              console.log('[audio] Creating blob and uploading:', blob.size, 'bytes');
              uploadAudioChunk(blob);
              chunksRef.current = [];
            }
          }, 1000);
        }
      };

      mediaRecorder.start(500);
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      console.log('[audio] MediaRecorder started, listening for audio');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      console.error('[audio] Microphone error:', message);
      setError(message);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log('[audio] Stopping audio capture');
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (silenceDetectorRef.current) {
      clearTimeout(silenceDetectorRef.current);
      silenceDetectorRef.current = null;
    }

    setIsListening(false);
    console.log('[audio] Audio capture stopped');
  };

  useEffect(() => {
    if (!enabled) return;

    return () => {
      stopListening();
    };
  }, [enabled]);

  return (
    <div className="fixed bottom-20 left-4 z-40 flex flex-col gap-2">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-white transition-all ${ isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600' }`}
      >
        <div
          className={`w-3 h-3 rounded-full ${ isListening ? 'animate-pulse bg-white' : 'bg-white/50' }`}
        />
        {isListening ? 'Stop' : 'Speak'}
      </button>

      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded">
          {error}
        </div>
      )}

      {isListening && (
        <div className="text-xs text-blue-300 bg-blue-900/20 px-3 py-1 rounded">
          🎤 Listening...
        </div>
      )}
    </div>
  );
}
