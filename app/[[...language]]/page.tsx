import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Dashboard from '../dashboard';
import { LanguageProvider } from '../language';
import { resolveLanguage } from '@/lib/languages';
import { LOCATION_PREFERENCE_COOKIE, parseLocationPreference } from '@/lib/location-preference';
import { EXPLORATION_COOKIE, parseExploration } from '@/lib/exploration-preference';
import { ExplorationProvider } from '../exploration';

export default async function Page({ params }: { params: Promise<{ language?: string[] }> }) {
  const language = resolveLanguage((await params).language);
  if (!language) notFound();
  const saved = await cookies();
  const preference = parseLocationPreference(saved.get(LOCATION_PREFERENCE_COOKIE)?.value);
  const exploration = parseExploration(saved.get(EXPLORATION_COOKIE)?.value);
  return <LanguageProvider key={language} language={language}><ExplorationProvider initial={exploration}><Dashboard initialPreference={preference} /></ExplorationProvider></LanguageProvider>;
}
