
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AlertDialogProvider } from '@/components/alert-dialog-provider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JoJo AI Studio',
  description: 'Chattez avec JoJo AI : expliquez votre idée, il crée votre application à votre place.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`dark ${spaceGrotesk.variable}`}>
      <body className="antialiased">
        <div className="jojo-aurora" aria-hidden="true" />
        <div className="jojo-grid" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
        <Toaster />
        <AlertDialogProvider />
      </body>
    </html>
  );
}
