
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AlertDialogProvider } from '@/components/alert-dialog-provider';

export const metadata: Metadata = {
  title: 'JoJo AI Studio',
  icons: {icon: '/brand/jojo-ai.png', apple: '/brand/jojo-ai.png'},
  referrer: 'no-referrer',
  description: 'AI-powered application development studio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased">
        {children}
        <Toaster />
        <AlertDialogProvider />
      </body>
    </html>
  );
}
