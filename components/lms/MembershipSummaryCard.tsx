'use client';

import Link from 'next/link';
import { ArrowRight, CreditCard, HardDrive, LockKeyhole, Users, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

type WorkspaceUsage = {
  title: string;
  scope: 'user' | 'organization';
  organizationName: string | null;
  activeUntil: string | null;
  creditBalance: number | null;
  limits: { maxMeetingMinutes: number | null; maxParticipants: number | null; seats: number | null; storageGb: number | null };
  usage: { storageBytes: number; storageLimitBytes: number | null; seatsUsed: number; seatLimit: number | null };
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return 'Custom';
  return minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`;
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
    return () => { active = false; };
  }, []);

  if (!workspace) return null;

  const activeUntil = workspace.activeUntil
    ? `Active until ${new Date(workspace.activeUntil).toLocaleDateString()}`
    : workspace.scope === 'organization'
      ? `${workspace.organizationName || 'Organization'} workspace`
      : 'Active membership';
  const credits = workspace.creditBalance == null ? 'Custom credits' : `${Math.round(workspace.creditBalance)} credits left`;
  const seatLabel = workspace.usage.seatLimit == null ? 'Custom' : `${workspace.usage.seatsUsed} / ${workspace.usage.seatLimit}`;
  const storageLabel = workspace.limits.storageGb == null ? 'Custom' : `${formatBytes(workspace.usage.storageBytes)} / ${workspace.limits.storageGb} GB`;

  return (
    <section className="membership-status-card w-full overflow-hidden rounded-[1.75rem] border border-[#402126] bg-[#0d0d0f] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.36)] sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-[13rem]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a6a1a6]"><LockKeyhole className="h-4 w-4 text-[#ef233c]" />Membership status</div>
            <span className="rounded-full border border-[#ef233c]/60 bg-[#ef233c]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#ff9ba7]">Signed in</span>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#7f7b80]">Current workspace</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">{workspace.title}</h2>
          <p className="mt-1 text-base text-[#b6b1b5]">{activeUntil} &middot; {credits}</p>
        </div>

        <dl className="grid flex-1 divide-y divide-white/10 border-y border-white/10 sm:grid-cols-2 sm:divide-y-0 sm:divide-x xl:grid-cols-4">
          <div className="min-w-0 py-3 sm:px-4 sm:first:pl-0 xl:py-1"><dt className="flex items-center gap-2 text-sm text-[#aaa5aa]"><Video className="h-4 w-4 shrink-0 text-[#ef233c]" />Meeting cap</dt><dd className="mt-2 truncate text-base font-bold text-white">{workspace.limits.maxParticipants ?? 'Custom'} people &middot; {formatDuration(workspace.limits.maxMeetingMinutes)}</dd></div>
          <div className="min-w-0 py-3 sm:px-4 xl:py-1"><dt className="flex items-center gap-2 text-sm text-[#aaa5aa]"><Users className="h-4 w-4 shrink-0 text-[#ef233c]" />Workspace seats</dt><dd className="mt-2 text-base font-bold text-white">{seatLabel}</dd></div>
          <div className="min-w-0 py-3 sm:px-4 sm:pt-4 xl:py-1"><dt className="flex items-center gap-2 text-sm text-[#aaa5aa]"><HardDrive className="h-4 w-4 shrink-0 text-[#ef233c]" />Storage</dt><dd className="mt-2 truncate text-base font-bold text-white">{storageLabel}</dd></div>
          <div className="min-w-0 py-3 sm:px-4 sm:pt-4 xl:py-1"><dt className="flex items-center gap-2 text-sm text-[#aaa5aa]"><CreditCard className="h-4 w-4 shrink-0 text-[#ef233c]" />Billing</dt><dd className="mt-2 text-base font-bold text-white">INR</dd></div>
        </dl>

        <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
          <Link href="/pricing" className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#ef233c] bg-[#141416] px-5 text-base font-bold text-white transition hover:bg-[#ef233c]">
            Manage plan <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="max-w-[17rem] text-sm leading-5 text-[#777277] xl:text-right">Seats are workspace members. Meeting participants are counted separately.</p>
        </div>
      </div>
    </section>
  );
}
