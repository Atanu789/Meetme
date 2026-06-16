import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import Feedback from '../../../../models/Feedback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { meetingId, type, userName, userEmail } = body;
    if (!meetingId || !type) return NextResponse.json({ error: 'meetingId and type required' }, { status: 400 });
    await db();
    const f = await Feedback.create({ meetingId, type, userName, userEmail });
    return NextResponse.json({ feedback: f });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
