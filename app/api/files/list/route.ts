import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const meetingId = url.searchParams.get('meetingId') || ''
    if (!meetingId) return NextResponse.json({ error: 'missing meetingId' }, { status: 400 })

    const { data, error } = await supabaseServer.storage.from('meeting-files').list(meetingId, { limit: 100 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // list() returns names relative to the folder; attach full storage path for actions.
    const files = (data || [])
      .filter((f: any) => f && f.name)
      .map((f: any) => ({
        name: f.name,
        path: `${meetingId}/${f.name}`,
      }))

    return NextResponse.json({ files })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
