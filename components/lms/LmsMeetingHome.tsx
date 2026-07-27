'use client';

import { useSession } from 'next-auth/react';
import { normalizeLmsRole } from '@/lib/lms-role';
import { LmsMeetingActions } from './LmsMeetingActions';
import { LmsShell } from './LmsShell';

export function LmsMeetingHome() {
  const { data: session } = useSession();
  const role = normalizeLmsRole((session?.user as any)?.lmsRole || (session?.user as any)?.role);
  const workspaceRole = role === 'student' || role === 'admin' ? role : 'instructor';
  const roleLabel = workspaceRole === 'admin' ? 'Admin' : workspaceRole === 'student' ? 'Student' : 'Instructor';

  return (
    <LmsShell
      role={workspaceRole}
      kicker="Meeting workspace"
      title="Create a meeting"
      description="Create a room, join with an invite, or start an instant meeting from one focused workspace."
    >
      <LmsMeetingActions roleLabel={roleLabel} />
    </LmsShell>
  );
}
