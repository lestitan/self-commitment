import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NavBar } from '@/components/ui/nav-bar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Self-Commitment Platform',
  description: 'Make commitments to your future self with financial stakes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <NavBar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}