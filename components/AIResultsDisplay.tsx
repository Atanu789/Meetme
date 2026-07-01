'use client';

import { useState } from 'react';
import {
  IconChevronDown,
  IconFileText,
  IconChecks,
  IconClipboardList,
  IconUsers,
  IconDownload,
} from '@tabler/icons-react';
import { motion } from 'motion/react';

interface ISpeaker {
  speakerId: string;
  name: string;
  color: string;
}

interface ITranscript {
  text: string;
  timestamp: number;
  speakerId: string;
  speaker: string;
}

interface IActionItem {
  item: string;
  owner?: string;
}

interface AIResultsDisplayProps {
  meetingId: string;
  summary?: string;
  keyNotes?: string[];
  keyDecisions?: string[];
  actionItems?: IActionItem[];
  transcript?: ITranscript[];
  speakerLabels?: ISpeaker[];
  className?: string;
}

export function AIResultsDisplay({
  meetingId,
  summary,
  keyNotes = [],
  keyDecisions = [],
  actionItems = [],
  transcript = [],
  speakerLabels = [],
  className = '',
}: AIResultsDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    summary ? 'summary' : null
  );

  const hasAIContent =
    summary ||
    keyNotes.length > 0 ||
    keyDecisions.length > 0 ||
    actionItems.length > 0 ||
    transcript.length > 0;

  if (!hasAIContent) {
    return null;
  }

  const getSpeakerColor = (speakerId: string): string => {
    const speaker = speakerLabels.find((s) => s.speakerId === speakerId);
    return speaker?.color || '#6B7280';
  };

  const formatTimestamp = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = () => {
    const txt = transcript
      .map((t) => `[${formatTimestamp(t.timestamp)}] ${t.speaker}: ${t.text}`)
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(txt)
    );
    element.setAttribute('download', `transcript-${meetingId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Summary Section */}
      {summary && (
        <motion.div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'summary' ? null : 'summary')
            }
            className="w-full flex items-center justify-between p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
          >
            <div className="flex items-center gap-3">
              <IconFileText size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Meeting Summary
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedSection === 'summary' ? 180 : 0 }}
            >
              <IconChevronDown size={20} className="text-blue-600 dark:text-blue-400" />
            </motion.div>
          </button>
          {expandedSection === 'summary' && (
            <div className="px-4 pb-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {summary}
            </div>
          )}
        </motion.div>
      )}

      {/* Key Notes Section */}
      {keyNotes.length > 0 && (
        <motion.div className="rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'notes' ? null : 'notes')
            }
            className="w-full flex items-center justify-between p-4 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition"
          >
            <div className="flex items-center gap-3">
              <IconFileText size={20} className="text-cyan-600 dark:text-cyan-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Key Notes ({keyNotes.length})
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedSection === 'notes' ? 180 : 0 }}
            >
              <IconChevronDown size={20} className="text-cyan-600 dark:text-cyan-400" />
            </motion.div>
          </button>
          {expandedSection === 'notes' && (
            <div className="px-4 pb-4 space-y-2">
              {keyNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold min-w-fit">
                    •
                  </span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Key Decisions Section */}
      {keyDecisions.length > 0 && (
        <motion.div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === 'decisions' ? null : 'decisions'
              )
            }
            className="w-full flex items-center justify-between p-4 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
          >
            <div className="flex items-center gap-3">
              <IconChecks size={20} className="text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Key Decisions ({keyDecisions.length})
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedSection === 'decisions' ? 180 : 0 }}
            >
              <IconChevronDown
                size={20}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </motion.div>
          </button>
          {expandedSection === 'decisions' && (
            <div className="px-4 pb-4 space-y-2">
              {keyDecisions.map((decision, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold min-w-fit">
                    •
                  </span>
                  <span>{decision}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Action Items Section */}
      {actionItems.length > 0 && (
        <motion.div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === 'actions' ? null : 'actions'
              )
            }
            className="w-full flex items-center justify-between p-4 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
          >
            <div className="flex items-center gap-3">
              <IconClipboardList
                size={20}
                className="text-amber-600 dark:text-amber-400"
              />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Action Items ({actionItems.length})
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedSection === 'actions' ? 180 : 0 }}
            >
              <IconChevronDown
                size={20}
                className="text-amber-600 dark:text-amber-400"
              />
            </motion.div>
          </button>
          {expandedSection === 'actions' && (
            <div className="px-4 pb-4 space-y-3">
              {actionItems.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold min-w-fit">
                      ☐
                    </span>
                    <span>{item.item}</span>
                  </div>
                  {item.owner && (
                    <div className="ml-5 text-xs text-gray-500 dark:text-gray-400">
                      <IconUsers size={14} className="inline mr-1" />
                      Owner: {item.owner}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Transcript Section */}
      {transcript.length > 0 && (
        <motion.div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === 'transcript' ? null : 'transcript'
              )
            }
            className="w-full flex items-center justify-between p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
          >
            <div className="flex items-center gap-3">
              <IconFileText
                size={20}
                className="text-purple-600 dark:text-purple-400"
              />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Full Transcript ({transcript.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTranscript();
                }}
                className="p-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition"
                title="Download transcript"
              >
                <IconDownload size={16} className="text-purple-600 dark:text-purple-400" />
              </button>
              <motion.div
                animate={{ rotate: expandedSection === 'transcript' ? 180 : 0 }}
              >
                <IconChevronDown
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
              </motion.div>
            </div>
          </button>
          {expandedSection === 'transcript' && (
            <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
              {transcript.map((entry, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded text-white"
                      style={{ backgroundColor: getSpeakerColor(entry.speakerId) }}
                    >
                      {entry.speaker}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-3">
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default AIResultsDisplay;
