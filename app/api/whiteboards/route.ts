import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'

const WHITEBOARD_BUCKET = 'meeting-files'

function getWhiteboardPath(meetingId: string) {
  return `whiteboards/${meetingId}.json`
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const meetingId = url.searchParams.get('meetingId') || ''

    if (!meetingId) {
      return NextResponse.json({ error: 'missing meetingId' }, { status: 400 })
    }

    const path = getWhiteboardPath(meetingId)
    const { data, error } = await supabaseServer.storage.from(WHITEBOARD_BUCKET).download(path)

    if (error || !data) {
      return NextResponse.json({ whiteboard: null })
    }

    const raw = await data.text()

    if (!raw.trim()) {
      return NextResponse.json({ whiteboard: null })
    }

    return NextResponse.json({ whiteboard: JSON.parse(raw) })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const meetingId = String(body?.meetingId || '').trim()

    if (!meetingId) {
      return NextResponse.json({ error: 'missing meetingId' }, { status: 400 })
    }

    const payload = {
      meetingId,
      elements: body?.elements || [],
      appState: body?.appState || {},
    }

    const path = getWhiteboardPath(meetingId)
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })

    const { error } = await supabaseServer.storage.from(WHITEBOARD_BUCKET).upload(path, blob, {
      contentType: 'application/json',
      upsert: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}