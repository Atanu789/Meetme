export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminAuthorization } from '../../../../lib/admin-auth';

export async function GET(request: Request) {
  const auth = await getAdminAuthorization(request);
  if (!auth.authorized) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({ authenticated: true, username: auth.username, source: auth.source });
}
