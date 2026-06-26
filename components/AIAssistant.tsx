'use client';

import { useEffect, useRef, useState } from 'react';
import { IconBrain, IconX, IconLoader2 } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { resolveMeetingAiHttpUrl } from '@/lib/meeting-ai-client';

interface AIAssistantProps {
  meetingId: string;
  onAIToggle?: (enabled: boolean) => void;
}

interface Language {
  code: string;
  name: string;
}

interface Caption {
  text: string;
  speaker: string;
  timestamp: number;
}

export function AIAssistant({ meetingId, onAIToggle }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch supported languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/ai/languages');
        if (response.ok) {
          const data = await response.json();
          setLanguages(data.languages);
        }
      } catch (error) {
        console.error('Failed to load languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleAI = async () => {
    if (aiEnabled) {
      // Disable AI
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/ai/init?meetingId=${encodeURIComponent(meetingId)}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          // Ask caption backend to flush any pending summarization for this meeting
          try {
            if (typeof window !== 'undefined') {
              const flushUrl = `${resolveMeetingAiHttpUrl()}/api/rooms/${encodeURIComponent(meetingId)}/flush`;
              await fetch(flushUrl, { method: 'POST' }).catch(() => {});
            }
          } catch (err) {
            // ignore flush errors; summarizer will run on timer as fallback
            console.warn('[AI] flush request failed', err);
          }

          setAiEnabled(false);
          setStatus('idle');
          setCaptions([]);
          onAIToggle?.(false);
        }
      } catch (error) {
        console.error('Failed to disable AI:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Enable AI
      try {
        setIsLoading(true);
        const response = await fetch('/api/ai/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId,
            language: selectedLanguage,
          }),
        });

        if (response.ok) {
          setAiEnabled(true);
          setStatus('recording');
          onAIToggle?.(true);
        } else {
          const error = await response.json();
          console.error('Failed to enable AI:', error.error);
        }
      } catch (error) {
        console.error('Failed to enable AI:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    // In a real implementation, this would trigger re-transcription or translation
  };

  return (
    <div className="relative">
      {/* AI Assistant Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          aiEnabled
            ? 'border-blue-300 bg-blue-100/85 text-blue-700 shadow-[0_10px_24px_rgba(37,99,235,0.16)] dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300'
            : 'border-slate-200 bg-slate-100/80 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-200/80 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700'
        }`}
        aria-label="AI assistant"
        title="AI Assistant"
      >
        <IconBrain size={20} />
        {status === 'recording' && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </motion.button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBrain size={20} />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded transition"
            >
              <IconX size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </span>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin text-blue-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Updating...
                    </span>
                  </>
                ) : (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      aiEnabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {aiEnabled ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>

            {/* Toggle AI */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable AI Assistant
              </span>
              <button
                onClick={toggleAI}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Language Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Transcription Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={aiEnabled || isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {aiEnabled
                  ? 'Cannot change language while recording'
                  : 'Select language before enabling AI'}
              </p>
            </div>

            {/* Live Captions */}
            {aiEnabled && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Live Captions
                </label>
                <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  {captions.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">
                      Captions will appear here...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {captions.slice(-5).map((caption, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {caption.speaker}
                          </span>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">
                            {caption.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-semibold">
                  {aiEnabled
                    ? 'Recording with AI Assistant'
                    : 'Enable AI to start real-time captions and post-meeting summary'}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default AIAssistant;
