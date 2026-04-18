'use client';

import Link from 'next/link';

interface MeetingCardProps {
  meetingId: string;
  title: string;
  hostEmail: string;
  createdAt: string;
  isPrivate: boolean;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  joinCount: number;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function MeetingCard({
  meetingId,
  title,
  hostEmail,
  createdAt,
  isPrivate,
  recordingEnabled,
  chatEnabled,
  joinCount,
}: MeetingCardProps) {
  const date = new Date(createdAt);
  const timeAgo = formatTimeAgo(date);

  return (
    <Link href={`/room/${meetingId}`}>
      <div className="surface group cursor-pointer rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="truncate font-display text-sm font-semibold text-slate-950 transition group-hover:text-blue-700 sm:text-base">
            {title}
          </h3>
        </div>
        <p className="mb-3 truncate text-xs text-slate-500 sm:mb-4 sm:text-sm">{hostEmail}</p>
        <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
          <span className={`pill ${isPrivate ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}`}>
            {isPrivate ? 'Private' : 'Public'} room
          </span>
          <span className="pill">
            {chatEnabled ? 'Chat stored' : 'Chat off'}
          </span>
          <span className="pill">
            {recordingEnabled ? 'Recording ready' : 'Recording off'}
          </span>
          <span className="pill">
            {joinCount} joins
          </span>
        </div>
        <p className="text-xs text-slate-500">Created {timeAgo}</p>
      </div>
    </Link>
  );
}
