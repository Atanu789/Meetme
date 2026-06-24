import { getServerSession } from 'next-auth';
import dbConnect from './db';
import { authOptions } from './auth-options';
import User from '../models/User';
import { LmsRole, normalizeLmsRole } from './lms-role';

export interface LmsUserContext {
  session: any;
  userId: string;
  userEmail: string;
  userName: string;
  lmsRole: LmsRole;
  organizationId: string | null;
}

export async function getLmsUserContext() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email?.toLowerCase() || '';

  if (!userEmail) {
    return null;
  }

  await dbConnect();

  const dbUser = await User.findOne({ email: userEmail });
  const role = normalizeLmsRole((session.user as any)?.lmsRole || (session.user as any)?.role || dbUser?.role);

  return {
    session,
    userId: (session.user as any)?.id?.toString?.() || dbUser?._id?.toString?.() || userEmail,
    userEmail,
    userName: session?.user?.name || dbUser?.name || userEmail.split('@')[0] || 'Learner',
    lmsRole: role,
    organizationId: dbUser?.organizationId ? dbUser.organizationId.toString() : null,
  } satisfies LmsUserContext;
}

export async function requireLmsUserContext(requiredRoles?: LmsRole[]) {
  const context = await getLmsUserContext();

  if (!context) {
    return { context: null, error: 'Unauthorized', status: 401 };
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(context.lmsRole)) {
    return { context: null, error: 'Forbidden', status: 403 };
  }

  return { context, error: null, status: 200 };
}
