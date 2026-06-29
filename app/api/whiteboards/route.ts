import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Whiteboard from '../../../models/Whiteboard';

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...noStoreHeaders,
      ...(init?.headers || {}),
    },
  });
}

function normalizeScene(body: any, meetingId: string) {
  return {
    meetingId,
    elements: Array.isArray(body?.elements) ? body.elements : [],
    appState: body?.appState && typeof body.appState === 'object' ? body.appState : {},
    files: body?.files && typeof body.files === 'object' ? body.files : {},
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const meetingId = (url.searchParams.get('meetingId') || '').trim();

    if (!meetingId) {
      return json({ error: 'missing meetingId' }, { status: 400 });
    }

    await dbConnect();

    const whiteboard = await Whiteboard.findOne({ meetingId }).lean();

    if (!whiteboard) {
      return json({ whiteboard: null });
    }

    return json({
      whiteboard: {
        meetingId: whiteboard.meetingId,
        elements: whiteboard.elements || [],
        appState: whiteboard.appState || {},
        files: whiteboard.sceneFiles || {},
        updatedAt: whiteboard.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('[whiteboards] load failed:', err);
    return json({ error: err?.message || 'Failed to load whiteboard' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const meetingId = String(body?.meetingId || '').trim();

    if (!meetingId) {
      return json({ error: 'missing meetingId' }, { status: 400 });
    }

    await dbConnect();

    const payload = normalizeScene(body, meetingId);

    const result = await Whiteboard.findOneAndUpdate(
      { meetingId },
      {
        $set: {
          elements: payload.elements,
          appState: payload.appState,
          sceneFiles: payload.files,
        },
        $setOnInsert: {
          meetingId,
        },
      },
      { new: true, upsert: true }
    );

    return json({ ok: true, updatedAt: result?.updatedAt });
  } catch (err: any) {
    console.error('[whiteboards] save failed:', err);
    return json({ error: err?.message || 'Failed to save whiteboard' }, { status: 500 });
  }
}
