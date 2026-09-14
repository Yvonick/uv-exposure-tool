import type { Location } from './locations';

export const LOCATION_PREFERENCE_COOKIE = 'uv_location';
export type LocationPreference = { location: Location | null; query: string };

// null is the automatic language default. An explicit selection stays explicit,
// even when the user happens to choose Paris, London or Berlin.
export function parseLocationPreference(value?: string): LocationPreference | undefined {
  if (!value || value.length > 6000) return;
  try {
    const preference = JSON.parse(value);
    if (!preference || typeof preference.query !== 'string' || preference.query.length > 500) return;
    if (preference.location === null) return { location: null, query: preference.query };
    const place = preference.location;
    if (!place || typeof place.name !== 'string' || !place.name || place.name.length > 300
      || typeof place.country !== 'string' || place.country.length > 200
      || !Number.isFinite(place.latitude) || Math.abs(place.latitude) > 90
      || !Number.isFinite(place.longitude) || Math.abs(place.longitude) > 180
      || !Number.isFinite(place.elevation) || place.elevation < -500 || place.elevation > 9000
      || typeof place.timezone !== 'string') return;
    new Intl.DateTimeFormat('en', { timeZone: place.timezone }).format(0);
    const location: Location = {
      name: place.name, country: place.country, latitude: place.latitude, longitude: place.longitude,
      elevation: place.elevation, timezone: place.timezone,
    };
    if (typeof place.admin1 === 'string' && place.admin1.length <= 300) location.admin1 = place.admin1;
    if (place.selectionMode === 'pin' || place.selectionMode === 'nearest-place') location.selectionMode = place.selectionMode;
    if (typeof place.timezoneFallback === 'boolean') location.timezoneFallback = place.timezoneFallback;
    if (Number.isFinite(place.selectionDistanceKm) && place.selectionDistanceKm >= 0 && place.selectionDistanceKm <= 100) location.selectionDistanceKm = place.selectionDistanceKm;
    return { location, query: preference.query };
  } catch { return; }
}

export function locationPreferenceCookie(preference: LocationPreference, secure: boolean) {
  // Keep within the browser's cookie size limit, including unusually long drafts.
  const value = { ...preference, query: preference.query.slice(0, 500) };
  let encoded = encodeURIComponent(JSON.stringify(value));
  if (encoded.length > 3800) encoded = encodeURIComponent(JSON.stringify({ ...value, query: '' }));
  return `${LOCATION_PREFERENCE_COOKIE}=${encoded}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
}
