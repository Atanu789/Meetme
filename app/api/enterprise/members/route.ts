export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';

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

    const members = await User.find({ organizationId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error('Enterprise members GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, organizationId } = await checkEnterpriseAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked' }, { status: 400 });
    }

    await dbConnect();

    const body = await req.json();
    const { email, role = 'user' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    
    // Find or create the user
    let user = await User.findOne({ email: emailLower });
    
    if (user) {
      // If user exists, update organization relation
      user.organizationId = organizationId;
      if (role === 'enterprise_admin') {
        user.role = 'enterprise_admin';
      } else {
        user.role = 'user'; // ordinary org member is 'user' or we keep their role if it was already 'admin'
      }
      await user.save();
    } else {
      // Pre-create the user in database so when they log in they are automatically part of this org
      user = new User({
        email: emailLower,
        name: emailLower.split('@')[0],
        role: role === 'enterprise_admin' ? 'enterprise_admin' : 'user',
        organizationId,
        status: 'active',
      });
      await user.save();
    }

    return NextResponse.json({ success: true, member: user });
  } catch (error: any) {
    console.error('Enterprise members POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { authorized, organizationId } = await checkEnterpriseAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked' }, { status: 400 });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (user.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Member does not belong to your organization' }, { status: 400 });
    }

    // Don't let enterprise admins remove themselves
    const session = await getServerSession(authOptions);
    if (user.email === session?.user?.email) {
      return NextResponse.json({ error: 'You cannot remove yourself from the organization' }, { status: 400 });
    }

    // Dissolve org relationship
    user.organizationId = null;
    if (user.role === 'enterprise_admin') {
      user.role = 'user';
    }
    await user.save();

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error: any) {
    console.error('Enterprise members DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
