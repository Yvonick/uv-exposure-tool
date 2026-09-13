'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { type Language, locales, languages, languageNames, languagePath } from '@/lib/languages';
import { translator } from '@/lib/translations';
import { formatLowWindow, type Interval } from '@/lib/solar';

const LanguageContext = createContext<Language>('en');
export function LanguageProvider({ language, children }: { language: Language; children: ReactNode }) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const language = useContext(LanguageContext);
  const locale = locales[language];
  const t = translator(language);
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const lowWindow = (windows: Interval[]) => formatLowWindow(windows).replace(/All day|None|Before|After/g, (word) => t(word));
  return { language, locale, t, number, lowWindow };
}
function Flag({ language }: { language: Language }) {
  return <svg viewBox="0 0 30 20" width="27" height="18" aria-hidden="true">
    {language === 'fr' ? <><path fill="#002654" d="M0 0h10v20H0z" /><path fill="#fff" d="M10 0h10v20H10z" /><path fill="#ed2939" d="M20 0h10v20H20z" /></>
      : language === 'de' ? <><path fill="#171717" d="M0 0h30v7H0z" /><path fill="#d00" d="M0 7h30v6H0z" /><path fill="#ffce00" d="M0 13h30v7H0z" /></>
      : <><path fill="#012169" d="M0 0h30v20H0z" /><path stroke="#fff" strokeWidth="5" d="m0 0 30 20M30 0 0 20" /><path stroke="#c8102e" strokeWidth="2" d="m0 0 30 20M30 0 0 20" /><path stroke="#fff" strokeWidth="7" d="M15 0v20M0 10h30" /><path stroke="#c8102e" strokeWidth="4" d="M15 0v20M0 10h30" /></>}
  </svg>;
}
export function LanguageSwitcher() {
  const { language, t } = useLanguage();
  return <nav className="language-switcher" aria-label={t('Language')}>
    {languages.map((choice) => <a key={choice} href={languagePath(choice)} hrefLang={choice} lang={choice}
      aria-label={languageNames[choice]} title={languageNames[choice]} aria-current={language === choice ? 'page' : undefined}>
      <Flag language={choice} /><span className="sr-only">{languageNames[choice]}</span>
    </a>)}
  </nav>;
}
