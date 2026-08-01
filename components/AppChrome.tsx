'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { BackgroundGradientAnimation } from './BackgroundGradientAnimation';
import { Navbar } from './Navbar';

export function AppChrome() {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');

  if (isAuthRoute) {
    return null;
  }

  return (
    <>
      <BackgroundGradientAnimation />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
    </>
  );
}
