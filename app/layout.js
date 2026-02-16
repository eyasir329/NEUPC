import '@/app/_styles/global.css';

import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import Header from './_components/layout/Header';
import Footer from './_components/layout/Footer';
import { auth } from '@/app/_lib/auth';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata = {
  title: {
    default: 'Welcome - NEUPC',
    template: '%s - NEUPC',
  },
  description: 'Netrokona University Programming Club(NEUPC)', //by default for all pages
};

export default async function RootLayout({ children }) {
  const session = await auth();
  
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className={`${inter.className} bg-background-dark text-primary-50 flex min-h-screen flex-col`}
      >
        <Header />
        <main className="grow">{children}</main>
        <Footer session={session} />
      </body>
    </html>
  );
}
