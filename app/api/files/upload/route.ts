import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'

export async function POST(req: Request) {
  try {
    console.log('[API/files/upload] Request received')

    const formData = await req.formData()
    const meetingId = String(formData.get('meetingId') || '')
    const file = formData.get('file') as File | null

    console.log('[API/files/upload] FormData parsed:', { meetingId, hasFile: !!file, fileName: file?.name, fileSize: file?.size })

    if (!meetingId) {
      console.error('[API/files/upload] Missing meetingId')
      return NextResponse.json({ error: 'missing meetingId' }, { status: 400 })
    }
    if (!file) {
      console.error('[API/files/upload] Missing file')
      return NextResponse.json({ error: 'missing file' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${meetingId}/${Date.now()}_${safeName}`

    console.log('[API/files/upload] Uploading to Supabase:', { path, contentType: file.type })

    const { error } = await supabaseServer.storage
      .from('meeting-files')
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (error) {
      console.error('[API/files/upload] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API/files/upload] Upload successful:', path)
    return NextResponse.json({ ok: true, path })
  } catch (err: any) {
    console.error('[API/files/upload] Catch error:', String(err), err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
