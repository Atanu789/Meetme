'use client';

import { useState, useCallback } from 'react';

export interface AIState {
  isEnabled: boolean;
  language: string;
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'recording' | 'processing';
  transcriptId: string | null;
}

export function useAI(meetingId: string) {
  const [state, setState] = useState<AIState>({
    isEnabled: false,
    language: 'en',
    isLoading: false,
    error: null,
    status: 'idle',
    transcriptId: null,
  });

  const enableAI = useCallback(
    async (language: string = 'en') => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/ai/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId, language }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to enable AI');
        }

        setState((prev) => ({
          ...prev,
          isEnabled: true,
          language,
          status: 'recording',
          isLoading: false,
        }));

        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
        return false;
      }
    },
    [meetingId]
  );

  const disableAI = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(
        `/api/ai/init?meetingId=${encodeURIComponent(meetingId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable AI');
      }

      setState((prev) => ({
        ...prev,
        isEnabled: false,
        status: 'idle',
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
      return false;
    }
  }, [meetingId]);

  const processMeeting = useCallback(
    async (recordingUrl?: string, transcriptId?: string) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        status: 'processing',
        error: null,
      }));

      try {
        const response = await fetch('/api/ai/process-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId,
            recordingUrl,
            transcriptId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to process meeting');
        }

        const result = await response.json();

        setState((prev) => ({
          ...prev,
          status: 'idle',
          isLoading: false,
        }));

        return result;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
          status: 'idle',
        }));
        return null;
      }
    },
    [meetingId]
  );

  const translateText = useCallback(
    async (text: string, targetLanguage: string) => {
      try {
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            targetLanguage,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Translation failed');
        }

        const result = await response.json();
        return result.translated;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
        }));
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    state,
    enableAI,
    disableAI,
    processMeeting,
    translateText,
    clearError,
  };
}

export default useAI;
