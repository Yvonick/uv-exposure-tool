import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultLocations } from '../lib/languages.ts';
import { parseLocationPreference, locationPreferenceCookie } from '../lib/location-preference.ts';

const roundTrip = preference => {
  const cookie = locationPreferenceCookie(preference, true);
  assert.match(cookie, /; Path=\/; SameSite=Lax; Secure$/);
  return parseLocationPreference(decodeURIComponent(cookie.split(';')[0].slice('uv_location='.length)));
};

test('automatic defaults follow language while an explicit city stays selected', () => {
  const automatic = roundTrip({ location: null, query: '' });
  for (const language of ['en', 'fr', 'de']) {
    assert.equal((automatic.location ?? defaultLocations[language]).name, defaultLocations[language].name);
  }
  const chosen = { location: defaultLocations.fr, query: 'Paris, Île-de-France, France' };
  for (const language of ['en', 'fr', 'de']) {
    const restored = roundTrip(chosen);
    assert.deepEqual(restored.location ?? defaultLocations[language], chosen.location);
    assert.equal(restored.query, chosen.query);
  }
});

test('language transfer preserves draft input, exact pins, elevation and clock metadata', () => {
  const location = { name: '90.00°N, 0.00°E', country: '', latitude: 90, longitude: 0, elevation: 0,
    timezone: 'UTC', selectionMode: 'pin', timezoneFallback: true };
  assert.deepEqual(roundTrip({ location, query: 'Montréal 100%' }), { location, query: 'Montréal 100%' });
  const mountain = { ...defaultLocations.de, name: 'Mountain', elevation: 4200, selectionMode: 'nearest-place', selectionDistanceKm: 99.5 };
  assert.deepEqual(roundTrip({ location: mountain, query: '' }).location, mountain);
});

test('malformed or invalid preferences fall back to the language default', () => {
  for (const value of [undefined, '', '{', 'null', '{"query":3,"location":null}',
    ...[{ latitude: 91 }, { longitude: -181 }, { elevation: 99999 }, { timezone: 'bad/timezone' }, { name: '' }]
      .map(override => JSON.stringify({ location: { ...defaultLocations.fr, ...override }, query: '' }))]) {
    assert.equal(parseLocationPreference(value), undefined);
  }
});
