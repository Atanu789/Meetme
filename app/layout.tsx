import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZoomClone - Video Conferencing',
  description: 'A modern, open-source video conferencing platform built with Jitsi',
  keywords: ['video conferencing', 'zoom clone', 'jitsi', 'meetings'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <AuthProvider>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
