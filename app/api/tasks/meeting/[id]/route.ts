import { NextResponse } from 'next/server';
import db from '@/lib/db';
import Task from '@/models/Task';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db();
    const tasks = await Task.find({ meetingId: params.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
