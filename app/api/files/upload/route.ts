import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const meetingId = String(formData.get('meetingId') || '')
    const file = formData.get('file') as File | null

    if (!meetingId) return NextResponse.json({ error: 'missing meetingId' }, { status: 400 })
    if (!file) return NextResponse.json({ error: 'missing file' }, { status: 400 })

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${meetingId}/${Date.now()}_${safeName}`

    const { error } = await supabaseServer.storage
      .from('meeting-files')
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, path })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
