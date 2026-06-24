import { LmsRole } from '@/lib/lms-role';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      role?: string;
      lmsRole?: LmsRole;
      organizationId?: string | null;
      status?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    lmsRole?: LmsRole;
    organizationId?: string | null;
    status?: string;
  }
}
