import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Dashboard from '../dashboard';
import { LanguageProvider } from '../language';
import { resolveLanguage } from '@/lib/languages';
import { LOCATION_PREFERENCE_COOKIE, parseLocationPreference } from '@/lib/location-preference';

export default async function Page({ params }: { params: Promise<{ language?: string[] }> }) {
  const language = resolveLanguage((await params).language);
  if (!language) notFound();
  const preference = parseLocationPreference((await cookies()).get(LOCATION_PREFERENCE_COOKIE)?.value);
  return <LanguageProvider key={language} language={language}><Dashboard initialPreference={preference} /></LanguageProvider>;
}
