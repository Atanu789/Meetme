import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';

export const getSessionUser = async () => {
  const session = await getServerSession(authOptions);
  return {
    email: session?.user?.email || null,
    name: session?.user?.name || null,
  };
};

export const isAuthenticated = async () => {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user?.email);
};

