import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { path } = body || {}
    if (!path) return NextResponse.json({ error: 'missing path' }, { status: 400 })

    const { error } = await supabaseServer.storage.from('meeting-files').remove([path])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
