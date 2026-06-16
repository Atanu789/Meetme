import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import Task from '../../../../models/Task';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ tasks: [] });
    await db();
    const tasks = await Task.find({ ownerEmail: session.user.email }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
