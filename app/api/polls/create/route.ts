import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import Poll from '../../../../models/Poll';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { meetingId, question, options, createdBy } = body;
    if (!meetingId || !question || !Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: 'meetingId, question and options required' }, { status: 400 });
    }
    await db();
    const opts = options.map((o: string) => ({ id: uuidv4(), label: o, votes: 0 }));
    const poll = await Poll.create({ meetingId, question, options: opts, createdBy });
    return NextResponse.json({ poll });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
