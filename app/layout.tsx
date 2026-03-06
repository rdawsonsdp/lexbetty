import type { Metadata, Viewport } from 'next';
import { Oswald, Roboto_Condensed } from 'next/font/google';
import './globals.css';
import Layout from '@/components/layout/Layout';
import { CateringProvider } from '@/context/CateringContext';

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const robotoCondensed = Roboto_Condensed({
  variable: '--font-roboto-condensed',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
});

export const metadata: Metadata = {
  title: 'CaterSmith | The right food. The right amount. Every event.',
  description:
    'CaterSmith offers exceptional catering for corporate events, meetings, and special occasions. The right food, the right amount, every event.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CaterSmith',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${oswald.variable} ${robotoCondensed.variable} antialiased`}
      >
        <CateringProvider>
          <Layout>{children}</Layout>
        </CateringProvider>
      </body>
    </html>
  );
}
