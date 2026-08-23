'use client';

import Link from 'next/link';
import { Crown, HardDrive, Users, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

type WorkspaceUsage = {
  plan: string;
  title: string;
  scope: 'user' | 'organization';
  organizationName: string | null;
  limits: {
    maxMeetingMinutes: number | null;
    maxParticipants: number | null;
    seats: number | null;
    storageGb: number | null;
  };
  usage: {
    storageBytes: number;
    storageLimitBytes: number | null;
    seatsUsed: number;
    seatLimit: number | null;
  };
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return 'Custom';
  if (minutes < 60) return `${minutes} min`;
  return `${minutes / 60} hr`;
}

export function MembershipSummaryCard() {
  const [workspace, setWorkspace] = useState<WorkspaceUsage | null>(null);

  useEffect(() => {
    let active = true;
    void fetch('/api/billing/usage', { credentials: 'include' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (active && response.ok) setWorkspace(body.workspace || null);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (!workspace) return null;

  const storagePercent = workspace.usage.storageLimitBytes
    ? Math.min(100, Math.round((workspace.usage.storageBytes / workspace.usage.storageLimitBytes) * 100))
    : 0;
  const seatLabel = workspace.usage.seatLimit == null
    ? `${workspace.usage.seatsUsed} active`
    : `${workspace.usage.seatsUsed} / ${workspace.usage.seatLimit}`;

  return (
    <section className="overflow-hidden rounded-lg border border-[#2a3039] bg-[#12151a]">
      <div className="flex flex-col gap-5 border-b border-[#2a3039] bg-[linear-gradient(135deg,rgba(55,215,255,0.13),transparent_55%)] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#37d7ff]"><Crown className="h-3.5 w-3.5" />Current plan</div>
          <h2 className="mt-2 font-display text-2xl font-semibold text-[#f4f7fa]">{workspace.title}</h2>
          <p className="mt-1 text-sm text-[#a7b1bc]">
            {workspace.scope === 'organization' ? `${workspace.organizationName || 'Organization'} workspace limits` : 'Personal workspace limits'}
          </p>
        </div>
        {workspace.plan !== 'enterprise' && (
          <Link href="/pricing" className="inline-flex h-10 items-center justify-center rounded-md border border-[#37d7ff]/40 bg-[#37d7ff]/10 px-4 text-sm font-semibold text-[#b9efff] transition hover:bg-[#37d7ff]/20">
            Manage plan
          </Link>
        )}
      </div>
      <div className="grid gap-px bg-[#2a3039] sm:grid-cols-3">
        <div className="bg-[#12151a] p-4">
          <div className="flex items-center gap-2 text-[#37d7ff]"><Video className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7d8897]">Meeting cap</span></div>
          <p className="mt-3 text-xl font-semibold text-[#f4f7fa]">{workspace.limits.maxParticipants == null ? 'Custom' : workspace.limits.maxParticipants}</p>
          <p className="mt-1 text-xs text-[#8f9aa8]">people · {formatDuration(workspace.limits.maxMeetingMinutes)} per session</p>
        </div>
        <div className="bg-[#12151a] p-4">
          <div className="flex items-center gap-2 text-[#37d7ff]"><Users className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7d8897]">Workspace seats</span></div>
          <p className="mt-3 text-xl font-semibold text-[#f4f7fa]">{seatLabel}</p>
          <p className="mt-1 text-xs text-[#8f9aa8]">Active members</p>
        </div>
        <div className="bg-[#12151a] p-4">
          <div className="flex items-center gap-2 text-[#37d7ff]"><HardDrive className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7d8897]">Storage</span></div>
          <p className="mt-3 text-xl font-semibold text-[#f4f7fa]">{formatBytes(workspace.usage.storageBytes)}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#37d7ff]" style={{ width: `${storagePercent}%` }} /></div>
          <p className="mt-1 text-xs text-[#8f9aa8]">{workspace.limits.storageGb == null ? 'Custom storage' : `${workspace.limits.storageGb} GB included`}</p>
        </div>
      </div>
    </section>
  );
}
