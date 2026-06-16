export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import dbConnect from '../../../../lib/db';
import Organization from '../../../../models/Organization';

async function checkEnterpriseAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { authorized: false, organizationId: null };
  }
  
  const user = session.user as any;
  const isAuthorized = user.role === 'enterprise_admin' || user.role === 'admin';
  
  return {
    authorized: isAuthorized,
    organizationId: user.organizationId,
  };
}

export async function GET() {
  try {
    const { authorized, organizationId } = await checkEnterpriseAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked' }, { status: 400 });
    }

    await dbConnect();

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, organization });
  } catch (error: any) {
    console.error('Enterprise org GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { authorized, organizationId } = await checkEnterpriseAuth();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked' }, { status: 400 });
    }

    await dbConnect();

    const body = await req.json();
    const { name, logoUrl, domain, policies, ssoSettings } = body;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (name) organization.name = name;
    if (logoUrl !== undefined) organization.logoUrl = logoUrl;
    if (domain !== undefined) {
      // Ensure domain isn't taken by another organization
      if (domain && domain.toLowerCase() !== organization.domain) {
        const existingOrg = await Organization.findOne({ domain: domain.toLowerCase() });
        if (existingOrg) {
          return NextResponse.json({ error: 'Domain already in use by another organization' }, { status: 400 });
        }
      }
      organization.domain = domain ? domain.toLowerCase() : undefined;
    }

    if (policies) {
      organization.policies = {
        ...organization.policies,
        ...policies,
      };
    }

    if (ssoSettings) {
      organization.ssoSettings = {
        ...organization.ssoSettings,
        ...ssoSettings,
      };
    }

    organization.updatedAt = new Date();
    await organization.save();

    return NextResponse.json({ success: true, organization });
  } catch (error: any) {
    console.error('Enterprise org PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
