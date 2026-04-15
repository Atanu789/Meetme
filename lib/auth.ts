import { auth } from '@clerk/nextjs';

export const getClerkUser = async () => {
  const { userId, sessionId } = await auth();
  return { userId, sessionId };
};

export const getClerkToken = async () => {
  const { getToken } = await auth();
  return getToken();
};

