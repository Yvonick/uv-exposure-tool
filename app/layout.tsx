import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://uv-exposure-tool.yvonichou.chatgpt.site'),
  title: 'UV Exposure Tool — UV data by location',
  description: 'Live UV conditions and a clear-sky annual view of when sun protection is usually recommended.',
  openGraph: {
    title: 'UV Exposure Tool',
    description: 'Live UV conditions, today’s UV timeline, and yearly low-UV windows for any location.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UV Exposure Tool',
    description: 'Live UV conditions, today’s UV timeline, and yearly low-UV windows for any location.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
