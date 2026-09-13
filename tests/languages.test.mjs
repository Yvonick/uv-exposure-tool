import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, locales, resolveLanguage, languagePath, defaultLocations } from '../lib/languages.ts';
import { messages, translator } from '../lib/translations.ts';
import { buildAnnualData } from '../lib/solar.ts';
import { lookupLocations } from '../lib/locations.ts';

test('language URLs resolve only the three supported versions with matching defaults', () => {
  assert.equal(resolveLanguage(), 'en');
  assert.equal(resolveLanguage([]), 'en');
  assert.equal(resolveLanguage(['fr']), 'fr');
  assert.equal(resolveLanguage(['de']), 'de');
  for (const path of [['xx'], ['fr', 'extra'], ['en'], ['FR']]) assert.equal(resolveLanguage(path), null);
  assert.deepEqual(languages.map(languagePath), ['/', '/fr', '/de']);
  assert.deepEqual(languages.map((language) => defaultLocations[language].name), ['London', 'Paris', 'Berlin']);
});

test('translations preserve interpolation values and annual model calculations', () => {
  assert.equal(new Set(messages.map(([key]) => key)).size, messages.length, 'translation keys must be unique');
  for (const [en, fr, de] of messages) {
    const variables = (text) => [...text.matchAll(/\{\w+\}/g)].map(([value]) => value).sort();
    assert.ok(fr.trim() && de.trim());
    assert.deepEqual(variables(fr), variables(en), en);
    assert.deepEqual(variables(de), variables(en), en);
  }
  for (const language of languages) {
    assert.match(translator(language)('{height} m elevation', { height: 42 }), /42/);
    const english = buildAnnualData(defaultLocations.fr, 2026);
    const localized = buildAnnualData(defaultLocations.fr, 2026, locales[language]);
    assert.deepEqual(localized.map(({ date, ...point }) => point), english.map(({ date, ...point }) => point));
  }
  assert.match(buildAnnualData(defaultLocations.fr, 2026, 'fr-FR')[0].date, /janv/);
});

test('location search requests names in the selected language', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      assert.equal(new URL(url).searchParams.get('language'), 'fr');
      return new Response(JSON.stringify({ results: [{ ...defaultLocations.fr }] }));
    };
    const [result] = await lookupLocations('Paris', 1, undefined, 'fr');
    assert.equal(result.country, 'France');
    assert.equal(result.elevation, 42);
  } finally { globalThis.fetch = originalFetch; }
});
