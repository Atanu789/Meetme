import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';
import Organization from '../../../../models/Organization';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, companyName, companyDomain } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = (role || 'user').toString();

    await dbConnect();

    // Check if user email already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Enterprise admin flow: require companyName and optionally domain
    let orgId: string | null = null;

    if (normalizedRole === 'enterprise_admin') {
      if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
        return NextResponse.json({ error: 'Company name is required for enterprise admin' }, { status: 400 });
      }

      // If domain provided, ensure uniqueness
      if (companyDomain && typeof companyDomain === 'string') {
        const domain = companyDomain.trim().toLowerCase();
        const existingOrg = await Organization.findOne({ domain });
        if (existingOrg) {
          return NextResponse.json({ error: 'Company domain is already registered' }, { status: 409 });
        }

        const org = new Organization({ name: companyName.trim(), domain });
        await org.save();
        orgId = org._id.toString();
      } else {
        const org = new Organization({ name: companyName.trim() });
        await org.save();
        orgId = org._id.toString();
      }
    }

    // Normal user joining by domain auto-join
    if (normalizedRole === 'user') {
      const parts = normalizedEmail.split('@');
      if (parts.length === 2) {
        const domain = parts[1].toLowerCase();
        // ignore common public providers
        const publicProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
        if (!publicProviders.includes(domain)) {
          const org = await Organization.findOne({ domain });
          if (org) orgId = org._id.toString();
        }
      }
    }

    // Create user record
    const user = new User({
      email: normalizedEmail,
      role: normalizedRole === 'enterprise_admin' ? 'enterprise_admin' : normalizedRole === 'admin' ? 'admin' : 'user',
      organizationId: orgId,
    });

    await user.save();

    return NextResponse.json({ ok: true, userId: user._id.toString(), organizationId: orgId || null });
  } catch (err: any) {
    console.error('Registration pre-create error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';



