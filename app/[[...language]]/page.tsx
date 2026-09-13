import { notFound } from 'next/navigation';
import Dashboard from '../dashboard';
import { LanguageProvider } from '../language';
import { resolveLanguage } from '@/lib/languages';

export default async function Page({ params }: { params: Promise<{ language?: string[] }> }) {
  const language = resolveLanguage((await params).language);
  if (!language) notFound();
  return <LanguageProvider key={language} language={language}><Dashboard /></LanguageProvider>;
}
