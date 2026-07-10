'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
  UserRound,
  XCircle,
} from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';

type MeetingHistoryRecord = {
  _id?: string;
  meetingId?: string;
  title?: string;
  recorded?: boolean;
  recordedBy?: string;
  recordingDuration?: string;
  recordingDurationSeconds?: number;
  recordingDate?: string;
  recordingStatus?: string;
  lastRecordingAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type MeetingHistoryResponse = {
  success?: boolean;
  meetings?: MeetingHistoryRecord[];
  error?: string;
};

export function MeetingHistoryPanel() {
  const [meetings, setMeetings] = useState<MeetingHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/meeting-history');
      const body = (await response.json().catch(() => ({}))) as MeetingHistoryResponse;

      if (!response.ok) {
        setError(body.error || 'Failed to load meeting history');
        setMeetings([]);
      } else {
        setMeetings(body.meetings || []);
      }
    } catch {
      setError('Failed to load meeting history');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const stats = useMemo(() => {
    const recordedMeetings = meetings.filter((meeting) => meeting.recorded);
    const totalDurationSeconds = recordedMeetings.reduce(
      (total, meeting) => total + Number(meeting.recordingDurationSeconds || 0),
      0
    );
    const latestRecording = recordedMeetings[0];

    return [
      { label: 'Meetings', value: meetings.length },
      { label: 'Recorded', value: recordedMeetings.length },
      { label: 'Duration', value: formatShortDuration(totalDurationSeconds) },
      { label: 'Latest', value: latestRecording ? formatHistoryDate(latestRecording) : 'None' },
    ];
  }, [meetings]);

  return (
    <GlowCard>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-950">Meeting History</h3>
            <p className="mt-1 text-sm text-slate-600">Recording status, duration, recorder, and download state.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={loading}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
            aria-label="Refresh meeting history"
            title="Refresh meeting history"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <p className="mt-1 truncate text-lg font-semibold text-slate-950">{stat.value}</p>
            </div>
          ))}
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1.35fr_0.7fr_0.75fr_0.9fr_0.75fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:grid">
            <span>Meeting</span>
            <span>Recorded</span>
            <span>Duration</span>
            <span>Recorder</span>
            <span>Status</span>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-sm text-slate-500">Loading meeting history...</div>
          ) : meetings.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">No meeting history yet.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {meetings.map((meeting) => {
                const recorded = Boolean(meeting.recorded);
                const status = meeting.recordingStatus || (recorded ? 'Downloaded' : 'Not recorded');

                return (
                  <div
                    key={meeting._id || meeting.meetingId || meeting.title}
                    className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.35fr_0.7fr_0.75fr_0.9fr_0.75fr] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{meeting.title || meeting.meetingId || 'Meeting'}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatHistoryDate(meeting)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      {recorded ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-400" />
                      )}
                      <span>{recorded ? 'Yes' : 'No'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      <span>{recorded ? formatShortDuration(meeting.recordingDurationSeconds, meeting.recordingDuration) : '-'}</span>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 text-slate-700">
                      <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{meeting.recordedBy || '-'}</span>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusClassName(status, recorded)}`}
                      >
                        {recorded ? <Download className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </GlowCard>
  );
}

function formatShortDuration(totalSeconds?: number, fallbackLabel?: string) {
  const parsedSeconds = Number(totalSeconds || 0) || parseDurationLabel(fallbackLabel);

  if (parsedSeconds <= 0) {
    return fallbackLabel || '-';
  }

  const hours = Math.floor(parsedSeconds / 3600);
  const minutes = Math.floor((parsedSeconds % 3600) / 60);
  const seconds = parsedSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${seconds} sec`;
}

function parseDurationLabel(value?: string) {
  const match = String(value || '').match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return 0;

  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function formatHistoryDate(meeting: MeetingHistoryRecord) {
  if (meeting.recordingDate) {
    return meeting.recordingDate;
  }

  const value = meeting.lastRecordingAt || meeting.updatedAt || meeting.createdAt;
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not recorded';
  }

  return date.toLocaleDateString();
}

function statusClassName(status: string, recorded: boolean) {
  if (!recorded) {
    return 'border-slate-200 bg-slate-50 text-slate-500';
  }

  if (status.toLowerCase() === 'downloaded') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700';
}
