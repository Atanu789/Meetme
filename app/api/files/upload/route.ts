import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'
import { LMS_STORAGE_BUCKET, buildLmsStoragePath } from '../../../../lib/lms-storage'

export async function POST(req: Request) {
  try {
    console.log('[API/files/upload] Request received')

    const formData = await req.formData()
    const scopeType = String(formData.get('scopeType') || 'meeting') === 'course' ? 'course' : 'meeting'
    const scopeId = String(formData.get('scopeId') || formData.get('meetingId') || '')
    const file = formData.get('file') as File | null

    console.log('[API/files/upload] FormData parsed:', { scopeType, scopeId, hasFile: !!file, fileName: file?.name, fileSize: file?.size })

    if (!scopeId) {
      console.error('[API/files/upload] Missing scopeId')
      return NextResponse.json({ error: 'missing scopeId' }, { status: 400 })
    }
    if (!file) {
      console.error('[API/files/upload] Missing file')
      return NextResponse.json({ error: 'missing file' }, { status: 400 })
    }

    const path = buildLmsStoragePath(scopeType, scopeId, file.name)

    console.log('[API/files/upload] Uploading to Supabase:', { path, contentType: file.type })

    const { error } = await supabaseServer.storage
      .from(LMS_STORAGE_BUCKET)
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
