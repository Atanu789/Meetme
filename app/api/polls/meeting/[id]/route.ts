import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import Poll from '../../../../../models/Poll';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db();
    const polls = await Poll.find({ meetingId: params.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ polls });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
