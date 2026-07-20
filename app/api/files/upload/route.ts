import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'
import { LMS_STORAGE_BUCKET, buildLmsStoragePath } from '../../../../lib/lms-storage'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth-options'
import { requireFeatureAccess } from '../../../../lib/membership'

const UPLOAD_LIMITS: Record<string, number> = {
  free: 100 * 1024 * 1024,
  pro: 1024 * 1024 * 1024,
  business: 5 * 1024 * 1024 * 1024,
  enterprise: 10 * 1024 * 1024 * 1024,
}

export async function POST(req: Request) {
  try {
    console.log('[API/files/upload] Request received')
    const session = await getServerSession(authOptions)
    const userEmail = String(session?.user?.email || '').toLowerCase()
    if (!userEmail) {
      return NextResponse.json({ error: 'Sign in and select a plan to upload files' }, { status: 401 })
    }

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

    const membershipCheck = await requireFeatureAccess(userEmail, 'files')
    if (!membershipCheck.ok) {
      return NextResponse.json(
        { error: membershipCheck.error, code: membershipCheck.code, membership: membershipCheck.membership || null },
        { status: membershipCheck.status }
      )
    }

    const maxFileSize = UPLOAD_LIMITS[membershipCheck.subscription.plan] || UPLOAD_LIMITS.free
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: `file too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB for this plan)` }, { status: 413 })
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
