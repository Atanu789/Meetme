import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { normalizeLmsRole } from '@/lib/lms-role';
import Meeting from '@/models/Meeting';
import MeetingActivity from '@/models/MeetingActivity';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { requireCredits, requireFeatureAccess } from '@/lib/membership';

const RECORDING_PERMISSION_ERROR = 'Only meeting hosts and instructors can record meetings.';

export const dynamic = 'force-dynamic';

type RecordingAction = 'check' | 'started' | 'completed';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = String(session?.user?.email || '').trim().toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ error: RECORDING_PERMISSION_ERROR }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const meetingId = String(body?.meetingId || '').trim();
    const action = String(body?.action || 'check').trim() as RecordingAction;

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 });
    }

    if (!['check', 'started', 'completed'].includes(action)) {
      return NextResponse.json({ error: 'Invalid recording action' }, { status: 400 });
    }

    await dbConnect();

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const dbUser = await User.findOne({ email: userEmail });
    const role = normalizeLmsRole(
      String((dbUser as any)?.role || (session.user as any)?.lmsRole || (session.user as any)?.role || '')
    );
    const isMeetingCreator = String(meeting.hostEmail || '').toLowerCase() === userEmail;
    const canRecord = Boolean(isMeetingCreator || role === 'instructor' || role === 'admin');

    if (meeting.recordingEnabled === false) {
      return NextResponse.json({ error: 'Recording is disabled for this meeting.' }, { status: 403 });
    }

    if (!canRecord) {
      return NextResponse.json({ error: RECORDING_PERMISSION_ERROR }, { status: 403 });
    }

    if (role !== 'admin') {
      const membershipCheck = await requireFeatureAccess(userEmail, 'recording');
      if (!membershipCheck.ok) {
        return NextResponse.json(
          { error: membershipCheck.error, code: membershipCheck.code, membership: membershipCheck.membership || null },
          { status: membershipCheck.status }
        );
      }
    }

    const recordedBy = resolveDisplayName(dbUser?.name || session.user?.name, userEmail);

    if (action === 'check') {
      return NextResponse.json({
        success: true,
        canRecord: true,
        recordedBy,
        metadata: serializeRecordingMetadata(meeting),
      });
    }

    if (action === 'started') {
      meeting.lastRecordingAt = new Date();
      await meeting.save();

      await MeetingActivity.create({
        meetingId,
        userId: userEmail,
        userName: recordedBy,
        userEmail,
        type: 'recording-started',
        details: 'Local browser recording started',
      });

      return NextResponse.json({ success: true });
    }

    const durationSeconds = Math.max(0, Math.floor(Number(body?.durationSeconds || 0)));
    if (role !== 'admin') {
      const creditCheck = await requireCredits(userEmail, Math.max(1, Math.ceil(durationSeconds / 60)), 'recording');
      if (!creditCheck.ok) {
        return NextResponse.json(
          { error: creditCheck.error, code: creditCheck.code, membership: creditCheck.membership || null },
          { status: creditCheck.status }
        );
      }
    }

    const recordingDuration = normalizeDurationLabel(body?.recordingDuration, durationSeconds);
    const recordingDate = normalizeRecordingDate(body?.recordingDate);
    const recordingStatus = 'Downloaded';

    meeting.recorded = true;
    meeting.recordedBy = recordedBy;
    meeting.recordedByEmail = userEmail;
    meeting.recordingDuration = recordingDuration;
    meeting.recordingDurationSeconds = durationSeconds;
    meeting.recordingDate = recordingDate;
    meeting.recordingStatus = recordingStatus;
    meeting.lastRecordingAt = new Date();
    await meeting.save();

    await MeetingActivity.create({
      meetingId,
      userId: userEmail,
      userName: recordedBy,
      userEmail,
      type: 'recording-stopped',
      details: `Local recording downloaded (${recordingDuration})`,
    });

    return NextResponse.json({
      success: true,
      metadata: serializeRecordingMetadata(meeting),
    });
  } catch (error: any) {
    console.error('[local-recording] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update recording metadata' },
      { status: 500 }
    );
  }
}

function serializeRecordingMetadata(meeting: any) {
  return {
    recorded: Boolean(meeting.recorded),
    recordedBy: meeting.recordedBy || '',
    recordingDuration: meeting.recordingDuration || '',
    recordingDurationSeconds: Number(meeting.recordingDurationSeconds || 0),
    recordingDate: meeting.recordingDate || '',
    recordingStatus: meeting.recordingStatus || '',
  };
}

function resolveDisplayName(name: unknown, email: string) {
  const cleanName = String(name || '').replace(/\s+/g, ' ').trim();
  if (cleanName) return cleanName;

  const localPart = email.split('@')[0] || 'Recorder';
  return localPart
    .split(/[._-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim() || email;
}

function normalizeDurationLabel(value: unknown, durationSeconds: number) {
  const label = String(value || '').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(label)) {
    return label;
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function normalizeRecordingDate(value: unknown) {
  const candidate = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return candidate;
  }

  return new Date().toISOString().slice(0, 10);
}
