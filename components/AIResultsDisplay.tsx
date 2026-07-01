'use client';

import { useMemo, useState } from 'react';
import {
  IconChevronDown,
  IconChecks,
  IconClipboardList,
  IconDownload,
  IconFileText,
  IconUsers,
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

type BriefSection = {
  id: string;
  title: string;
  items: string[];
  icon: typeof IconFileText;
  tone: string;
  emptyText: string;
};

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
  const [showTranscript, setShowTranscript] = useState(false);
  const polishedSummary = cleanText(summary);
  const notes = useMemo(() => cleanList(keyNotes), [keyNotes]);
  const decisions = useMemo(() => cleanList(keyDecisions), [keyDecisions]);
  const actions = useMemo(
    () =>
      actionItems
        .map((item) => ({
          item: cleanText(item?.item),
          owner: cleanText(item?.owner),
        }))
        .filter((item) => item.item.length > 0),
    [actionItems]
  );

  const hasAIContent =
    polishedSummary ||
    notes.length > 0 ||
    decisions.length > 0 ||
    actions.length > 0 ||
    transcript.length > 0;

  if (!hasAIContent) {
    return null;
  }

  const sections: BriefSection[] = [
    {
      id: 'notes',
      title: 'Key Notes',
      items: notes,
      icon: IconFileText,
      tone: 'border-cyan-100 bg-cyan-50/70 text-cyan-700',
      emptyText: 'No key notes were identified yet.',
    },
    {
      id: 'decisions',
      title: 'Decisions',
      items: decisions,
      icon: IconChecks,
      tone: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
      emptyText: 'No explicit decisions were captured.',
    },
  ];

  const getSpeakerColor = (speakerId: string): string => {
    const speaker = speakerLabels.find((item) => item.speakerId === speakerId);
    return speaker?.color || '#334155';
  };

  const downloadTranscript = () => {
    const text = transcript
      .map((entry) => `[${formatTimestamp(entry.timestamp)}] ${entry.speaker}: ${entry.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = `transcript-${meetingId}.txt`;
    document.body.appendChild(element);
    element.click();
    element.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Meeting Brief
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-slate-950">
              Executive Summary
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Notes" value={notes.length} />
            <Metric label="Decisions" value={decisions.length} />
            <Metric label="Actions" value={actions.length} />
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-700">
          {polishedSummary || 'A professional summary will appear once enough meeting context has been captured.'}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map((section) => (
          <BriefList key={section.id} section={section} />
        ))}
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
        <div className="flex items-center gap-2 text-amber-800">
          <IconClipboardList className="h-5 w-5" />
          <h4 className="font-display text-base font-semibold">Action Items</h4>
        </div>
        {actions.length > 0 ? (
          <div className="mt-3 space-y-2">
            {actions.map((action, index) => (
              <div key={`${action.item}-${index}`} className="rounded-xl border border-amber-100 bg-white px-3 py-2">
                <p className="text-sm font-medium leading-5 text-slate-800">{action.item}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {action.owner ? `Owner: ${action.owner}` : 'Owner not assigned'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No action items were assigned.</p>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowTranscript((value) => !value)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                <IconUsers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-slate-950">Speaker Transcript</p>
                <p className="truncate text-xs text-slate-500">
                  {transcript.length} entries from {speakerLabels.length || 'unknown'} speakers
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  downloadTranscript();
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                title="Download transcript"
                aria-label="Download transcript"
              >
                <IconDownload className="h-4 w-4" />
              </button>
              <motion.div animate={{ rotate: showTranscript ? 180 : 0 }}>
                <IconChevronDown className="h-5 w-5 text-slate-500" />
              </motion.div>
            </div>
          </button>

          {showTranscript && (
            <div className="max-h-96 space-y-3 overflow-y-auto border-t border-slate-100 px-4 py-4">
              {transcript.map((entry, index) => (
                <div key={`${entry.timestamp}-${entry.speakerId}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: getSpeakerColor(entry.speakerId) }}
                    >
                      {entry.speaker || entry.speakerId || 'Speaker'}
                    </span>
                    <span className="text-xs text-slate-500">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{entry.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-base font-semibold text-slate-950">{value}</div>
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
    </div>
  );
}

function BriefList({ section }: { section: BriefSection }) {
  const Icon = section.icon;

  return (
    <div className={`rounded-2xl border p-4 ${section.tone}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h4 className="font-display text-base font-semibold">{section.title}</h4>
      </div>
      {section.items.length > 0 ? (
        <ol className="mt-3 space-y-2">
          {section.items.map((item, index) => (
            <li key={`${section.id}-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm leading-5 text-slate-700">
              {item}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{section.emptyText}</p>
      )}
    </div>
  );
}

function cleanText(value?: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

function cleanList(items: string[]) {
  const seen = new Set<string>();

  return items
    .map(cleanText)
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatTimestamp(ms: number): string {
  const seconds = Math.floor(Number(ms || 0) / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default AIResultsDisplay;
