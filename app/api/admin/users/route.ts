export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';
import Organization from '../../../../models/Organization';

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return { authorized: false, session: null };
  }
  return { authorized: true, session };
}

export async function GET(req: NextRequest) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    // Fetch organizations to attach names to user objects
    const organizations = await Organization.find({}, '_id name');
    const orgMap = new Map(organizations.map((org) => [org._id.toString(), org.name]));

    const usersWithOrg = users.map((user) => {
      const userObj = user.toObject();
      return {
        ...userObj,
        organizationName: userObj.organizationId ? orgMap.get(userObj.organizationId.toString()) || 'Unknown Org' : null,
      };
    });

    return NextResponse.json({ success: true, users: usersWithOrg });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const { userId, role, status, organizationId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't let admins demote themselves accidentally
    const session = await getServerSession(authOptions);
    if (user.email === session?.user?.email && role && role !== 'admin') {
      return NextResponse.json({ error: 'You cannot demote yourself' }, { status: 400 });
    }

    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (organizationId !== undefined) user.organizationId = organizationId || null;

    await user.save();

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Admin users PUT error:', error);
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (user.email === session?.user?.email) {
      return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
