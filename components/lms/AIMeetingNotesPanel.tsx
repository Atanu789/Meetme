'use client';

import Link from 'next/link';
import { Download, FileText, Sparkles, Users } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';

type TranscriptEntry = {
  text?: string;
  timestamp?: number;
  speakerId?: string;
  speaker?: string;
};

type AIMeeting = {
  _id?: string;
  meetingId: string;
  title?: string;
  summary?: string;
  keyNotes?: string[];
  keyDecisions?: string[];
  transcript?: TranscriptEntry[];
  speakerLabels?: Array<{ speakerId: string; name: string }>;
  updatedAt?: string;
};

interface AIMeetingNotesPanelProps {
  meetings?: AIMeeting[];
  title?: string;
}

export function AIMeetingNotesPanel({
  meetings = [],
  title = 'AI Meeting Notes',
}: AIMeetingNotesPanelProps) {
  const visibleMeetings = meetings.filter((meeting) => (
    meeting?.summary ||
    (meeting?.keyNotes || []).length > 0 ||
    (meeting?.transcript || []).length > 0
  ));

  return (
    <GlowCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            <Sparkles className="h-4 w-4" />
            AssemblyAI
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Speaker-labeled transcripts, summaries, and key notes from recent meetings.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <FileText className="h-4 w-4 text-cyan-600" />
          {visibleMeetings.length} ready
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visibleMeetings.map((meeting) => (
          <div key={meeting._id || meeting.meetingId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {meeting.title || meeting.meetingId}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{meeting.updatedAt ? new Date(meeting.updatedAt).toLocaleString() : meeting.meetingId}</span>
                  {(meeting.speakerLabels || []).length > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {meeting.speakerLabels?.length} speakers
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadTranscript(meeting)}
                  disabled={(meeting.transcript || []).length === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Transcript
                </button>
                <Link
                  href={`/recordings/${encodeURIComponent(meeting.meetingId)}`}
                  className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Open
                </Link>
              </div>
            </div>

            {meeting.summary ? (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{meeting.summary}</p>
            ) : null}

            {(meeting.keyNotes || []).length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(meeting.keyNotes || []).slice(0, 4).map((note, index) => (
                  <div key={`${meeting.meetingId}-note-${index}`} className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-xs leading-5 text-slate-700">
                    {note}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {visibleMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
            AI summaries and downloadable transcripts will appear here after meetings are processed.
          </div>
        ) : null}
      </div>
    </GlowCard>
  );
}

function downloadTranscript(meeting: AIMeeting) {
  const lines = (meeting.transcript || []).map((entry) => {
    const speaker = entry.speaker || entry.speakerId || 'Speaker';
    return `[${formatTimestamp(Number(entry.timestamp || 0))}] ${speaker}: ${entry.text || ''}`;
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transcript-${meeting.meetingId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatTimestamp(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
