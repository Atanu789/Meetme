import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import dbConnect from '../../../lib/db';
import Meeting from '../../../models/Meeting';
import User from '../../../models/User';
import Organization from '../../../models/Organization';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user belongs to an organization and fetch its policies
    let orgPolicies = null;
    const dbUser = await User.findOne({ email: userEmail.toLowerCase() });
    if (dbUser && dbUser.organizationId) {
      const org = await Organization.findById(dbUser.organizationId);
      if (org) {
        orgPolicies = org.policies;
      }
    }

    const body = await req.json();
    let {
      title,
      description,
      isPrivate = false,
      chatEnabled = true,
      recordingEnabled = true,
    } = body;

    // Apply enterprise organization policy overrides
    if (orgPolicies) {
      if (orgPolicies.recordingAllowed === false) {
        recordingEnabled = false;
      }
      if (orgPolicies.chatEnabled === false) {
        chatEnabled = false;
      }
      if (orgPolicies.requirePassword === true) {
        isPrivate = true;
      }
    }

    title = String(title || '').trim();
    description = String(description || '').trim();

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const meetingId = nanoid(12).toLowerCase();

    const meeting = new Meeting({
      meetingId,
      hostId: userEmail,
      hostEmail: userEmail,
      title,
      description,
      isPrivate,
      chatEnabled,
      recordingEnabled,
    });

    await meeting.save();

    return NextResponse.json(
      {
        success: true,
        meetingId,
        meeting,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
