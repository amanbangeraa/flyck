import '../styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Flyck Admin',
  description: 'Push slideshows to Raspberry Pi displays',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}