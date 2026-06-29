'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateMeetingModal } from '@/components/CreateMeetingModal';
import { JoinModal } from '@/components/JoinModal';
import { GlowCard } from '@/components/ui/glow-card';
import { GradientBorderButton } from '@/components/ui/gradient-border-button';

export function LmsMeetingActions({ roleLabel }: { roleLabel: string }) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const createMeeting = async (payload: { title: string; description: string }) => {
    const response = await fetch('/api/create-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to create meeting');
    }

    if (data?.meetingId) {
      router.push(`/room/${encodeURIComponent(data.meetingId)}`);
    }
  };

  const handleStartMeeting = async () => {
    setError('');
    setIsStarting(true);

    try {
      await createMeeting({
        title: `${roleLabel} instant meeting`,
        description: `Started from the ${roleLabel.toLowerCase()} LMS dashboard.`,
      });
    } catch (startError: any) {
      setError(startError?.message || 'Failed to start meeting');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <GlowCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Meeting Hub</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">Create, join, or start a meeting</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Use these quick actions from your LMS dashboard instead of the old generic dashboard.
            </p>
            {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <GradientBorderButton variant="create" onClick={() => setIsCreateModalOpen(true)}>
              Create Meeting
            </GradientBorderButton>
            <GradientBorderButton variant="join" onClick={() => setIsJoinModalOpen(true)}>
              Join Meeting
            </GradientBorderButton>
            <GradientBorderButton variant="dark" onClick={handleStartMeeting} disabled={isStarting}>
              {isStarting ? 'Starting...' : 'Start Now'}
            </GradientBorderButton>
          </div>
        </div>
      </GlowCard>

      <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createMeeting}
      />
    </>
  );
}
