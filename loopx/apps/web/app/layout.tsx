import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Geist, Geist_Mono, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import { AppProvider } from './context/AppContext';

const dmSans = localFont({
  src: [
    {
      path: '../fonts/DM_Sans/DMSans-VariableFont_opsz,wght.ttf',
      style: 'normal',
    },
    {
      path: '../fonts/DM_Sans/DMSans-Italic-VariableFont_opsz,wght.ttf',
      style: 'italic',
    },
  ],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'loopx — Real-Time Creative Review',
  description:
    'Collaborative ad proofing canvas with real-time contextual annotations, voice huddles, and multi-format support. Powered by CometChat.',
  icons: {
    icon: '/loogx-logo&favicon.png',
    shortcut: '/loogx-logo&favicon.png',
    apple: '/loogx-logo&favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-neutral-900 antialiased font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
