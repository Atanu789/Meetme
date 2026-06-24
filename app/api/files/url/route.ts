import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'
import { LMS_STORAGE_BUCKET } from '../../../../lib/lms-storage'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const path = url.searchParams.get('path') || ''
    if (!path) return NextResponse.json({ error: 'missing path' }, { status: 400 })

    const { data, error } = await supabaseServer.storage
      .from(LMS_STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 10)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ url: data?.signedUrl || '' })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
