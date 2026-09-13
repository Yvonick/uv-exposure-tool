export type Language = 'en' | 'fr' | 'de';
export const languages: Language[] = ['en', 'fr', 'de'];
export const languageNames = { en: 'English', fr: 'Français', de: 'Deutsch' };
export const locales = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };
export const languagePath = (language: Language) => language === 'en' ? '/' : `/${language}`;
export function resolveLanguage(segments?: string[]): Language | null {
  if (!segments?.length) return 'en';
  return segments.length === 1 && (segments[0] === 'fr' || segments[0] === 'de') ? segments[0] : null;
}

// Open-Meteo geocoding, 13 September 2026. Elevation is retained in the solar model.
export const defaultLocations = {
  en: { name: 'London', country: 'United Kingdom', admin1: 'England', latitude: 51.50853, longitude: -.12574, timezone: 'Europe/London', elevation: 25 },
  fr: { name: 'Paris', country: 'France', admin1: 'Île-de-France', latitude: 48.85341, longitude: 2.3488, timezone: 'Europe/Paris', elevation: 42 },
  de: { name: 'Berlin', country: 'Deutschland', admin1: 'Berlin', latitude: 52.52437, longitude: 13.41053, timezone: 'Europe/Berlin', elevation: 74 },
};
