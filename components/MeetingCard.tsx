'use client';

import Link from 'next/link';

interface MeetingCardProps {
  meetingId: string;
  title: string;
  hostEmail: string;
  createdAt: string;
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
}: MeetingCardProps) {
  const date = new Date(createdAt);
  const timeAgo = formatTimeAgo(date);

  return (
    <Link href={`/room/${meetingId}`}>
      <div className="backdrop-blur-sm bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:bg-slate-800/80 transition cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition truncate">
            {title}
          </h3>
        </div>
        <p className="text-xs text-gray-400 mb-2 truncate">{hostEmail}</p>
        <p className="text-xs text-gray-500">{timeAgo}</p>
      </div>
    </Link>
  );
}
