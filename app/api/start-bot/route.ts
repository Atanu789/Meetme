import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, meetingUrl, botName } = body;

    if (!meetingId || !meetingUrl) {
      return NextResponse.json(
        { error: 'meetingId and meetingUrl are required' },
        { status: 400 }
      );
    }

    console.log(`[start-bot] Triggering bot for meeting: ${meetingId}`);
    console.log(`[start-bot] Meeting URL: ${meetingUrl}`);

    // Call the meeting-ai service to start the bot
    const meetingAiUrl = (process.env.MEETING_AI_CONTROL_URL || 'http://localhost:4010').replace(/\/$/, '');
    
    const response = await fetch(`${meetingAiUrl}/api/start-bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId,
        meetingUrl,
        botName: botName || 'Melanam Bot',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[start-bot] Error from meeting-ai service:', error);
      return NextResponse.json(
        { error: `Failed to start bot: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[start-bot] Bot started successfully:', data);

    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    console.error('[start-bot] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start bot' },
      { status: 500 }
    );
  }
}
