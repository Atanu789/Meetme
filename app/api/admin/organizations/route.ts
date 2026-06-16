export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import dbConnect from '../../../../lib/db';
import Organization from '../../../../models/Organization';
import User from '../../../../models/User';

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return { authorized: false };
  }
  return { authorized: true };
}

export async function GET() {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const organizations = await Organization.find({}).sort({ createdAt: -1 });

    // Aggregate member counts for each organization
    const orgsWithCount = await Promise.all(
      organizations.map(async (org) => {
        const memberCount = await User.countDocuments({ organizationId: org._id.toString() });
        return {
          ...org.toObject(),
          memberCount,
        };
      })
    );

    return NextResponse.json({ success: true, organizations: orgsWithCount });
  } catch (error: any) {
    console.error('Admin organizations GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const { name, domain, billingPlan, recordingAllowed = true, chatEnabled = true, requirePassword = false } = body;

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    if (domain) {
      // Check if domain is already registered
      const existingOrg = await Organization.findOne({ domain: domain.toLowerCase() });
      if (existingOrg) {
        return NextResponse.json({ error: 'An organization with this domain already exists' }, { status: 400 });
      }
    }

    const org = new Organization({
      name,
      domain: domain ? domain.toLowerCase() : undefined,
      billingPlan: billingPlan || 'enterprise',
      policies: {
        recordingAllowed,
        chatEnabled,
        requirePassword,
      },
    });

    await org.save();

    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    console.error('Admin organizations POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Dissolve organization relation from users belonging to it
    await User.updateMany({ organizationId: orgId }, { $set: { organizationId: null, role: 'user' } });

    await Organization.findByIdAndDelete(orgId);

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error: any) {
    console.error('Admin organizations DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
