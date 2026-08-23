import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getWorkspaceQuota, getWorkspaceUsage } from '@/lib/workspace-usage';
import { findMembershipByEmail, getCreditBalance, isSubscriptionActive } from '@/lib/membership';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = String(session?.user?.email || '').trim().toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session?.user as any)?.role === 'admin';
    const quota = await getWorkspaceQuota(userEmail, isAdmin);
    if (!quota) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const subscription = isAdmin ? null : await findMembershipByEmail(userEmail);
    if (quota.scope === 'user' && !isAdmin) {
      if (!subscription || !isSubscriptionActive(subscription)) {
        return NextResponse.json({ error: 'Choose an active plan to use the workspace.', code: 'PLAN_REQUIRED' }, { status: 402 });
      }
    }

    const workspace = await getWorkspaceUsage(userEmail, isAdmin);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workspace: {
        plan: workspace.plan,
        title: workspace.planDefinition.title,
        scope: workspace.scope,
        organizationName: workspace.organizationName || null,
        activeUntil: subscription?.currentPeriodEnd?.toISOString() || null,
        creditBalance: subscription ? getCreditBalance(subscription) : workspace.planDefinition.includedCredits,
        limits: {
          maxMeetingMinutes: workspace.planDefinition.maxMeetingMinutes,
          maxParticipants: workspace.planDefinition.maxParticipants,
          monthlyRooms: workspace.planDefinition.monthlyRooms,
          seats: workspace.planDefinition.seats,
          storageGb: workspace.planDefinition.storageGb,
        },
        usage: workspace.usage,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load workspace usage' }, { status: 500 });
  }
}
