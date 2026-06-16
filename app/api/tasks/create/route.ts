import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import Task from '../../../../models/Task';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await db();
    const { meetingId, title, description, ownerName, ownerEmail } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    const task = await Task.create({ meetingId, title, description, ownerName, ownerEmail });
    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
