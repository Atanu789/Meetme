export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminCredentials, createAdminToken, getAdminCookieName } from '../../../../lib/admin-auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const creds = getAdminCredentials();

    if (!creds.username || !creds.password) {
      return NextResponse.json({ error: 'Admin credentials are not configured' }, { status: 500 });
    }

    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const token = createAdminToken(username);
    const response = NextResponse.json({ success: true, username });
    response.cookies.set(getAdminCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to login' }, { status: 500 });
  }
}
