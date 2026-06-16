import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import Poll from '../../../../models/Poll';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pollId, optionId } = body;
    if (!pollId || !optionId) return NextResponse.json({ error: 'pollId and optionId required' }, { status: 400 });
    await db();
    const poll = await Poll.findById(pollId);
    if (!poll) return NextResponse.json({ error: 'poll not found' }, { status: 404 });
    const opt = poll.options.find((o: any) => o.id === optionId);
    if (!opt) return NextResponse.json({ error: 'option not found' }, { status: 404 });
    opt.votes = (opt.votes || 0) + 1;
    await poll.save();
    return NextResponse.json({ poll });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
