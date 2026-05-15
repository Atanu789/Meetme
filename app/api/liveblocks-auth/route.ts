import { NextResponse } from 'next/server';
import { Liveblocks } from '@liveblocks/node';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || '',
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const room = String(body?.room || '').trim();

    if (!room) {
      return NextResponse.json({ error: 'missing room' }, { status: 400 });
    }

    const userId = session?.user?.email?.trim() || `guest:${room}:${crypto.randomUUID()}`;
    const userName = session?.user?.name?.trim() || session?.user?.email?.trim() || 'Guest';

    if (!process.env.LIVEBLOCKS_SECRET_KEY) {
      return NextResponse.json({ error: 'missing Liveblocks secret' }, { status: 500 });
    }

    const liveblocksSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        email: session?.user?.email || undefined,
      },
    });

    liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);

    const auth = await liveblocksSession.authorize();
    return new Response(auth.body, {
      status: auth.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}