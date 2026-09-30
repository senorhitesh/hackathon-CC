import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AppProvider } from './context/AppContext';

const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'AdProof — Real-Time Creative Review',
  description:
    'Collaborative ad proofing canvas with real-time contextual annotations, voice huddles, and multi-format support. Powered by CometChat.',
  icons: {
    icon: '/loogx-logo&favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} dark`}>
      <body className="bg-canvas-bg text-canvas-fg antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
