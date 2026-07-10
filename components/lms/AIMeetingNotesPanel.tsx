'use client';

import Link from 'next/link';
import { CheckCircle2, Download, FileText, ListChecks, Sparkles, Users } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';

type TranscriptEntry = {
  text?: string;
  timestamp?: number;
  speakerId?: string;
  speaker?: string;
};

type ActionItem = {
  item?: string;
  owner?: string;
};

type AIMeeting = {
  _id?: string;
  meetingId: string;
  title?: string;
  summary?: string;
  keyNotes?: string[];
  keyDecisions?: string[];
  actionItems?: ActionItem[];
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
  const visibleMeetings = meetings
    .filter((meeting) => (
      cleanText(meeting?.summary) ||
      (meeting?.keyNotes || []).length > 0 ||
      (meeting?.keyDecisions || []).length > 0 ||
      (meeting?.actionItems || []).length > 0 ||
      (meeting?.transcript || []).length > 0
    ))
    .slice(0, 8);

  const totalNotes = visibleMeetings.reduce((count, meeting) => count + (meeting.keyNotes || []).length, 0);
  const totalActions = visibleMeetings.reduce((count, meeting) => count + (meeting.actionItems || []).length, 0);

  return (
    <GlowCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            <Sparkles className="h-4 w-4" />
            Meeting Intelligence
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Clean summaries, decisions, action items, and speaker transcripts from recent sessions.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <PanelMetric label="Briefs" value={visibleMeetings.length} />
          <PanelMetric label="Notes" value={totalNotes} />
          <PanelMetric label="Actions" value={totalActions} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visibleMeetings.map((meeting) => {
          const notes = cleanList(meeting.keyNotes || []).slice(0, 3);
          const decisions = cleanList(meeting.keyDecisions || []).slice(0, 2);
          const actions = (meeting.actionItems || [])
            .map((item) => ({ item: cleanText(item?.item), owner: cleanText(item?.owner) }))
            .filter((item) => item.item.length > 0)
            .slice(0, 2);
          const summaryPoints = splitSummary(cleanText(meeting.summary));
          const leadSummary =
            summaryPoints[0] ||
            'Summary is still being prepared for this meeting.';
          const supportingSummary = summaryPoints.slice(1, 3);

          return (
            <article
              key={meeting._id || meeting.meetingId}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-cyan-200 hover:bg-white"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-base font-semibold text-slate-950">
                      {meeting.title || meeting.meetingId}
                    </p>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                      {meeting.updatedAt ? new Date(meeting.updatedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <StatChip icon={FileText} label={`${(meeting.transcript || []).length} transcript lines`} />
                    <StatChip icon={Users} label={`${(meeting.speakerLabels || []).length || 0} speakers`} />
                    <StatChip icon={CheckCircle2} label={`${(meeting.keyDecisions || []).length} decisions`} />
                    <StatChip icon={ListChecks} label={`${(meeting.actionItems || []).length} actions`} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadTranscript(meeting)}
                    disabled={(meeting.transcript || []).length === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Transcript
                  </button>
                  <Link
                    href={`/recordings/${encodeURIComponent(meeting.meetingId)}`}
                    className="inline-flex items-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open Brief
                  </Link>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/70 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">
                  Main Takeaway
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-800">
                  {leadSummary}
                </p>
                {supportingSummary.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {supportingSummary.map((point, index) => (
                      <div key={`${meeting.meetingId}-summary-${index}`} className="flex gap-2 text-xs leading-5 text-slate-600">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {(notes.length > 0 || decisions.length > 0 || actions.length > 0) && (
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <MiniList title="Key Notes" items={notes} emptyText="No notes yet" />
                  <MiniList title="Decisions" items={decisions} emptyText="No decisions" />
                  <MiniList
                    title="Actions"
                    items={actions.map((action) => action.owner ? `${action.owner}: ${action.item}` : action.item)}
                    emptyText="No actions"
                  />
                </div>
              )}
            </article>
          );
        })}

        {visibleMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm leading-6 text-slate-500">
            Professional summaries, key notes, decisions, action items, and downloadable transcripts will appear here after meetings are processed.
          </div>
        ) : null}
      </div>
    </GlowCard>
  );
}

function PanelMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="font-display text-lg font-semibold text-slate-950">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
    </div>
  );
}

function StatChip({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
      <Icon className="h-3.5 w-3.5 text-cyan-600" />
      {label}
    </span>
  );
}

function MiniList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      {items.length > 0 ? (
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="flex gap-2 text-xs leading-5 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400">{emptyText}</p>
      )}
    </div>
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

function splitSummary(value: string) {
  const sentences = cleanText(value)
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g);

  return (sentences || [])
    .map(cleanText)
    .filter((sentence) => sentence.length > 0)
    .slice(0, 5);
}

function formatTimestamp(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
