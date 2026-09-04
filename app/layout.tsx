import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UV//WINDOW — UV exposure by location',
  description: 'Live UV conditions and a clear-sky annual view of when sun protection is usually recommended.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
