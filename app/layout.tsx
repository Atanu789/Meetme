import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { Navbar } from '../components/Navbar';
import { AuthProvider } from '../components/AuthProvider';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Melanam',
  description: 'Simple, secure video meetings with chat, recording, and private rooms.',
  keywords: ['video conferencing', 'melanam', 'jitsi', 'meetings', 'chat', 'recording'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
    >
      <html lang="en" className={`${sans.variable} ${display.variable}`}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <script
            dangerouslySetInnerHTML={{
              __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = stored ? stored === 'dark' : prefersDark;
    if (useDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (_) {}
})();`,
            }}
          />
        </head>
        <body>
          <AuthProvider>
            <Navbar />
            <main className="app-main pt-16">
              {children}
            </main>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

