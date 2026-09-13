import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveLanguage, languagePath } from '@/lib/languages';
import { translator } from '@/lib/translations';
import '../globals.css';

type Props = { children: React.ReactNode; params: Promise<{ language?: string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const language = resolveLanguage((await params).language);
  if (!language) notFound();
  const t = translator(language);
  const title = t('UV Exposure — yearly UV windows by location');
  const description = t('Live UV conditions, today’s UV timeline, and yearly low-UV windows for any location.');
  return {
    metadataBase: new URL('https://uv-exposure-tool.yvonichou.chatgpt.site'),
    title, description,
    alternates: { canonical: languagePath(language), languages: { en: '/', fr: '/fr', de: '/de', 'x-default': '/' } },
    openGraph: { title, description, url: languagePath(language), locale: { en: 'en_GB', fr: 'fr_FR', de: 'de_DE' }[language], images: ['/og.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  };
}
export default async function RootLayout({ children, params }: Props) {
  const language = resolveLanguage((await params).language);
  if (!language) notFound();
  return <html lang={language}><body>{children}</body></html>;
}
