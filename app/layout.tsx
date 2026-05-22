import type { Metadata } from 'next';
import { AppChrome } from '../components/AppChrome';
import { Providers } from './providers';
import ThemeInitializer from '../components/ThemeInitializer';
import '@excalidraw/excalidraw/index.css';
import './globals.css';
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';

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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <Providers>
          <ThemeInitializer />
          <AppChrome />
          <main className="app-main pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

