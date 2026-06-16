export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';
import Meeting from '../../../../models/Meeting';

async function checkEnterpriseAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { authorized: false, organizationId: null };
  }
  
  const user = session.user as any;
  const isAuthorized = user.role === 'enterprise_admin' || user.role === 'admin';
  
  return {
    authorized: isAuthorized,
    organizationId: user.organizationId,
  };
}

export async function GET() {
  try {
    const { authorized, organizationId } = await checkEnterpriseAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked' }, { status: 400 });
    }

    await dbConnect();

    // Find all users belonging to the organization
    const orgMembers = await User.find({ organizationId }, 'email');
    const memberEmails = orgMembers.map((m) => m.email);

    // Find meetings where hostEmail is in memberEmails
    const meetings = await Meeting.find({ hostEmail: { $in: memberEmails } }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, meetings });
  } catch (error: any) {
    console.error('Enterprise meetings GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
