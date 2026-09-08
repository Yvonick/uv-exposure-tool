import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://uv-exposure-tool.yvonichou.chatgpt.site'),
  title: 'UV Exposure — yearly UV windows by location',
  description: 'Explore yearly low-UV windows for any location, check current UV, and understand the effects of skin sensitivity, clouds, ground reflection, altitude and exposure time.',
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
