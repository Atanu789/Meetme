import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { Navbar } from '../components/Navbar';
import { Providers } from './providers';
import ThemeInitializer from '../components/ThemeInitializer';
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
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <Providers>
          <ThemeInitializer />
          <Navbar />
          <main className="app-main pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

