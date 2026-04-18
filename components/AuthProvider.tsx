'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useUserStore } from '../store/useUserStore';
import { Loader } from './Loader';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { setLoading } = useUserStore();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        useUserStore.setState({
          user: {
            userId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          loading: false,
        });
      } else {
        useUserStore.setState({
          user: null,
          loading: false,
        });
      }
    }
  }, [user, isLoaded]);

  if (!isLoaded) {
    return <Loader />;
  }

  return <>{children}</>;
}
