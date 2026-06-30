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

    const MAX_FILE_SIZE = 100 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'file too large (max 100MB)' }, { status: 413 })
    }

    const path = buildLmsStoragePath(scopeType, scopeId, file.name)

    console.log('[API/files/upload] Uploading to Supabase:', { path, contentType: file.type, size: file.size })

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabaseServer.storage
      .from(LMS_STORAGE_BUCKET)
      .upload(path, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (error) {
      console.error('[API/files/upload] Supabase error:', error)
      return NextResponse.json({ error: error.message || 'upload failed' }, { status: 500 })
    }

    console.log('[API/files/upload] Upload successful:', data?.path || path)
    return NextResponse.json({ ok: true, path: data?.path || path, size: file.size, name: file.name })
  } catch (err: any) {
    console.error('[API/files/upload] Catch error:', String(err), err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
