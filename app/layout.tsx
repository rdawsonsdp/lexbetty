import type { Metadata, Viewport } from 'next';
import { Oswald, Roboto_Condensed } from 'next/font/google';
import './globals.css';
import Layout from '@/components/layout/Layout';
import { CateringProvider } from '@/context/CateringContext';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import { AuthProvider } from '@/context/AuthContext';

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
  title: 'Lexington Betty Smokehouse | Best BBQ in Chicago',
  description:
    'Lexington Betty Smokehouse offers exceptional BBQ catering for corporate events, meetings, and special occasions. Best BBQ in Chicago.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lexington Betty Smokehouse',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1A1A1A',
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
        <AnalyticsProvider>
          <AuthProvider>
            <CateringProvider>
              <Layout>{children}</Layout>
            </CateringProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
