import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const meetingId = params.id;
    if (!meetingId) return NextResponse.json({ error: 'missing id' }, { status: 400 });
    await dbConnect();
    const meeting = await Meeting.findOne({ meetingId }).lean() as any;
    if (!meeting) return NextResponse.json({ error: 'meeting not found' }, { status: 404 });

    const transcript = Array.isArray(meeting.transcript) ? meeting.transcript.slice() : [];
    transcript.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));

    // Build contiguous speaker segments by merging consecutive entries with same speaker
    type Segment = { speaker: string; start: number; end: number };
    const segments: Segment[] = [];
    for (let i = 0; i < transcript.length; i++) {
      const cur = transcript[i];
      const next = transcript[i + 1];
      const start = Number(cur?.timestamp || 0);
      const end = next ? Number(next.timestamp || start + 2) : start + 2;
      let dur = end - start;
      if (!isFinite(dur) || dur <= 0) dur = 2;
      const speaker = cur?.speakerId || cur?.speaker || 'unknown';

      if (segments.length === 0) {
        segments.push({ speaker, start, end: start + dur });
      } else {
        const last = segments[segments.length - 1];
        if (last.speaker === speaker) {
          // extend last segment end
          last.end = Math.max(last.end, start + dur);
        } else {
          segments.push({ speaker, start, end: start + dur });
        }
      }
    }

    const durations: Record<string, number> = {};
    for (const seg of segments) {
      const segDur = Math.max(0, (seg.end || 0) - (seg.start || 0));
      durations[seg.speaker] = (durations[seg.speaker] || 0) + segDur;
    }

    const total = Object.values(durations).reduce((s, v) => s + v, 0) || 0;

    const labelsById: Record<string, string> = {};
    if (Array.isArray(meeting.speakerLabels)) {
      for (const s of meeting.speakerLabels) {
        if (s && s.speakerId) labelsById[s.speakerId] = s.name || s.speaker || s.label || s.speakerId;
      }
    }

    const speakers = Object.keys(durations).map((id) => {
      const dur = durations[id] || 0;
      const percent = total > 0 ? Math.round((dur / total) * 100) : 0;
      return {
        id,
        name: labelsById[id] || id,
        duration: dur,
        percent,
      };
    }).sort((a, b) => b.duration - a.duration);

    return NextResponse.json({ speakers, totalDuration: total });
  } catch (err: any) {
    console.error('analytics error', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
