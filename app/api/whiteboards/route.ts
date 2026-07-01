import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Whiteboard from '../../../models/Whiteboard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

class WhiteboardRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

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

async function readJsonBody(req: Request) {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new WhiteboardRequestError('Invalid whiteboard payload');
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const meetingId = (url.searchParams.get('meetingId') || '').trim();

    if (!meetingId) {
      console.warn('[whiteboards] GET: missing meetingId');
      return json({ error: 'missing meetingId' }, { status: 400 });
    }

    console.log('[whiteboards] GET request - meetingId:', meetingId);
    await dbConnect();

    const whiteboard = await Whiteboard.findOne({ meetingId }).lean();

    if (!whiteboard) {
      console.log('[whiteboards] ⚠️ NO whiteboard found for meetingId:', meetingId);
      console.log('[whiteboards] Querying all whiteboards to check what exists...');
      const allWhiteboards = await Whiteboard.find({}).select('meetingId elements').limit(5).lean();
      console.log('[whiteboards] Sample whiteboards in DB:', allWhiteboards.map(w => ({ id: w.meetingId, elemCount: w.elements?.length || 0 })));
      return json({ whiteboard: null });
    }

    console.log('[whiteboards] ✅ Found whiteboard for meetingId:', meetingId);
    console.log('[whiteboards] Raw DB data - elements type:', typeof whiteboard.elements, 'length:', whiteboard.elements?.length || 0);
    console.log('[whiteboards] Raw DB data - appState keys:', Object.keys(whiteboard.appState || {}).length);
    console.log('[whiteboards] Raw DB data - sceneFiles keys:', Object.keys(whiteboard.sceneFiles || {}).length);

    const responseData = {
      whiteboard: {
        meetingId: whiteboard.meetingId,
        elements: Array.isArray(whiteboard.elements) ? whiteboard.elements : [],
        appState: whiteboard.appState && typeof whiteboard.appState === 'object' ? whiteboard.appState : {},
        files: whiteboard.sceneFiles && typeof whiteboard.sceneFiles === 'object' ? whiteboard.sceneFiles : {},
        updatedAt: whiteboard.updatedAt,
      },
    };
    
    console.log('[whiteboards] Returning response - elements:', responseData.whiteboard.elements.length, 'updatedAt:', responseData.whiteboard.updatedAt);
    return json(responseData);
  } catch (err: any) {
    console.error('[whiteboards] load failed:', err?.message || String(err), 'stack:', err?.stack);
    return json({ error: err?.message || 'Failed to load whiteboard' }, { status: 500 });
  }
}

async function saveWhiteboard(req: Request) {
  try {
    const body = await readJsonBody(req);
    const meetingId = String(body?.meetingId || '').trim();

    if (!meetingId) {
      console.warn('[whiteboards] POST/PUT: missing meetingId');
      return json({ error: 'missing meetingId' }, { status: 400 });
    }

    console.log('[whiteboards] 📝 RAW BODY received:', {
      meetingId,
      elementsType: typeof body?.elements,
      elementsIsArray: Array.isArray(body?.elements),
      elementsLength: body?.elements?.length,
      hasElements: !!body?.elements,
    });

    console.log('[whiteboards] saving for meetingId:', meetingId, 'elements:', Array.isArray(body?.elements) ? body.elements.length : 0);

    await dbConnect();

    const payload = normalizeScene(body, meetingId);
    
    console.log('[whiteboards] 📦 NORMALIZED PAYLOAD:', {
      elementsLength: payload.elements.length,
      appStateKeys: Object.keys(payload.appState).length,
      filesKeys: Object.keys(payload.files).length,
    });

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

    console.log('[whiteboards] ✅ SAVED TO DB:', {
      meetingId: result?.meetingId,
      elementsInDB: result?.elements?.length || 0,
      appStateInDB: Object.keys(result?.appState || {}).length,
      updatedAt: result?.updatedAt,
    });

    return json({
      ok: true,
      updatedAt: result?.updatedAt,
      elementCount: payload.elements.length,
      hasFiles: Object.keys(payload.files).length > 0,
    });
  } catch (err: any) {
    console.error('[whiteboards] save failed:', err?.message || String(err), 'stack:', err?.stack);
    return json(
      { error: err?.message || 'Failed to save whiteboard' },
      { status: err?.status || 500 }
    );
  }
}

async function deleteWhiteboard(req: Request) {
  try {
    const url = new URL(req.url);
    const meetingId = (url.searchParams.get('meetingId') || '').trim();

    if (!meetingId) {
      console.warn('[whiteboards] DELETE: missing meetingId');
      return json({ error: 'missing meetingId' }, { status: 400 });
    }

    await dbConnect();

    const result = await Whiteboard.deleteOne({ meetingId });

    console.log('[whiteboards] deleted whiteboard:', {
      meetingId,
      deletedCount: result.deletedCount || 0,
    });

    return json({
      ok: true,
      deletedCount: result.deletedCount || 0,
    });
  } catch (err: any) {
    console.error('[whiteboards] delete failed:', err?.message || String(err), 'stack:', err?.stack);
    return json(
      { error: err?.message || 'Failed to delete whiteboard' },
      { status: err?.status || 500 }
    );
  }
}

export async function PUT(req: Request) {
  return saveWhiteboard(req);
}

export async function POST(req: Request) {
  return saveWhiteboard(req);
}

export async function DELETE(req: Request) {
  return deleteWhiteboard(req);
}
