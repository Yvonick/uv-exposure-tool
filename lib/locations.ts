export type Location = {
  name: string; country: string; admin1?: string; latitude: number; longitude: number; timezone: string; elevation: number;
  selectionDistanceKm?: number;
  selectionMode?: 'nearest-place' | 'pin';
  timezoneFallback?: boolean;
};
export const DEFAULT_LOCATION: Location = {
  name: 'Berlin', country: 'Germany', admin1: 'Berlin', latitude: 52.5244, longitude: 13.4105, timezone: 'Europe/Berlin', elevation: 74,
};
export const formatLocationLabel = (location: Location) => [location.name, location.admin1 && location.admin1 !== location.name ? location.admin1 : null, location.country].filter(Boolean).join(', ');

export function parseCoordinates(query: string): { latitude: number; longitude: number } | null {
  // Decimal commas require an unambiguous semicolon or whitespace separator.
  const localized = query.trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*;\s*([+-]?\d+(?:[.,]\d+)?)$/)
    ?? query.trim().match(/^([+-]?\d+,\d+)\s+([+-]?\d+(?:[.,]\d+)?)$/);
  const normalized = localized ? `${localized[1].replace(',', '.')};${localized[2].replace(',', '.')}` : query.trim();
  const match = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*[,;\s]\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if (!match) return null;
  const latitude = Number(match[1]), longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error('Use latitude −90 to 90, then longitude −180 to 180.');
  }
  return { latitude, longitude };
}

function validMetadata(timezone: unknown, elevation: unknown): boolean {
  if (typeof timezone !== 'string' || typeof elevation !== 'number' || !Number.isFinite(elevation) || elevation < -500 || elevation > 9000) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); return true; } catch { return false; }
}

const coordinateCache = new Map<string, Location>();
const coordinateName = (latitude: number, longitude: number) => `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
export async function resolveCoordinates(latitude: number, longitude: number, signal?: AbortSignal): Promise<Location> {
  signal?.throwIfAborted();
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Invalid coordinates.');
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = coordinateCache.get(key);
  if (cached) return { ...cached, latitude, longitude };
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'is_day', timezone: 'auto', forecast_days: '1' });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) throw new Error('Could not resolve elevation and local time. Please try again.');
  const data = await response.json() as { elevation?: number; timezone?: string };
  if (!validMetadata(data.timezone, data.elevation)) throw new Error('Could not resolve elevation and local time. Please try again.');
  const location = { name: coordinateName(latitude, longitude), country: '', latitude, longitude, timezone: data.timezone!, elevation: data.elevation! };
  coordinateCache.set(key, location);
  return location;
}

const countryNames = new Map<string, Map<string, string>>();
export function splitPlaceQuery(query: string, language = 'en'): { name: string; countryCode?: string } {
  let names = countryNames.get(language);
  if (!names) {
    names = new Map();
  for (const locale of new Set(['en', language])) {
    const regions = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
    for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b), name = regions.of(code);
      if (new Intl.Locale(`und-${code}`).maximize().region !== code) continue;
      if (name && name !== code) names.set(name.toLocaleLowerCase(locale), code);
    }
  }
    for (const [alias, code] of Object.entries({ uk: 'GB', 'u.k.': 'GB', usa: 'US', 'u.s.a.': 'US', 'u.s.': 'US' })) names.set(alias, code);
    countryNames.set(language, names);
  }
  const text = query.trim();
  for (const [name, code] of [...names].sort((a, b) => b[0].length - a[0].length)) {
    const lower = text.toLocaleLowerCase(language);
    // Leave state abbreviations such as CA to the geocoder's native parser.
    for (const separator of [', ', ',',' ']) {
      const suffix = separator + name;
      if (lower.endsWith(suffix) && text.length > suffix.length) return { name: text.slice(0, -suffix.length).trim(), countryCode: code };
    }
  }
  return { name: text };
}

export async function lookupLocations(query: string, count = 6, signal?: AbortSignal, language = 'en'): Promise<Location[]> {
  const coordinates = parseCoordinates(query);
  if (coordinates) return [await resolveCoordinates(coordinates.latitude, coordinates.longitude, signal)];
  async function search(name: string, countryCode?: string) {
    const params = new URLSearchParams({ name, count: String(count), language, format: 'json' });
    if (countryCode) params.set('countryCode', countryCode);
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
    if (!response.ok) throw new Error('Location search is temporarily unavailable. Please try again.');
    return response.json() as Promise<{ results?: Location[] }>;
  }
  let data = await search(query);
  if (!data.results?.length) {
    const placeQuery = splitPlaceQuery(query, language);
    if (placeQuery.countryCode) data = await search(placeQuery.name, placeQuery.countryCode);
  }
  return (data.results ?? []).filter((r) => validMetadata(r.timezone, r.elevation) && Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && Math.abs(r.latitude) <= 90 && Math.abs(r.longitude) <= 180).map((r) => ({
    name: r.name, country: r.country ?? '', admin1: r.admin1, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone, elevation: r.elevation,
  }));
}

export async function lookupLocation(query: string, signal?: AbortSignal, language = 'en'): Promise<Location> {
  const [location] = await lookupLocations(query, 1, signal, language);
  if (!location) throw new Error('No matching place found. Try a city and country, or latitude, longitude.');
  return location;
}

export type NamedPlace = [name: string, countryCode: string, latitude: number, longitude: number];
let placeIndex: NamedPlace[] | undefined;
let placeIndexRequest: Promise<NamedPlace[]> | undefined;

export function nearestPlace(places: NamedPlace[], latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Invalid coordinates.');
  const radians = Math.PI / 180;
  let nearest: NamedPlace | undefined, minimum = Infinity;
  for (const place of places) {
    // Haversine distance remains correct across the date line and near the poles.
    const distance = Math.sin((place[2] - latitude) * radians / 2) ** 2
      + Math.cos(latitude * radians) * Math.cos(place[2] * radians)
      * Math.sin((place[3] - longitude) * radians / 2) ** 2;
    if (distance < minimum) { minimum = distance; nearest = place; }
  }
  if (!nearest) throw new Error('The place index is empty. Please try the location search.');
  return { place: nearest, distanceKm: 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, minimum)))) };
}

async function resolveGlobePin(latitude: number, longitude: number, signal?: AbortSignal): Promise<Location> {
  const pin: Location = { name: coordinateName(latitude, longitude), country: '', latitude, longitude,
    elevation: 0, timezone: 'UTC', timezoneFallback: true, selectionMode: 'pin' };
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude),
    elevation: '0', timezone: 'auto', current: 'is_day', forecast_days: '1', cell_selection: 'nearest' });
  try {
    // A missing time zone or unavailable weather service must not prevent a remote selection.
    const timeout = AbortSignal.timeout(5000);
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
    if (response.ok) {
      const data = await response.json() as { timezone?: string };
      if (validMetadata(data.timezone, 0)) { pin.timezone = data.timezone!; pin.timezoneFallback = false; }
    }
  } catch { signal?.throwIfAborted(); }
  signal?.throwIfAborted();
  return pin;
}

export async function resolveGlobeLocation(latitude: number, longitude: number, signal?: AbortSignal, language = 'en'): Promise<Location> {
  signal?.throwIfAborted();
  if (!placeIndex) {
    placeIndexRequest ??= (async () => {
    const response = await fetch('/data/places.json', { signal: AbortSignal.timeout(15_000), cache: 'force-cache' });
    if (!response.ok) throw new Error('Could not load place names. Please try again or use the location search.');
    const data = await response.json() as NamedPlace[];
    if (!Array.isArray(data) || !data.length || data.some((place) => !Array.isArray(place)
      || typeof place[0] !== 'string' || !/^[A-Z]{2}$/.test(place[1])
      || !Number.isFinite(place[2]) || Math.abs(place[2]) > 90
      || !Number.isFinite(place[3]) || Math.abs(place[3]) > 180)) throw new Error('The place index is unavailable. Please use the location search.');
    placeIndex = data;
    return data;
    })().finally(() => { placeIndexRequest = undefined; });
    await placeIndexRequest;
  }
  signal?.throwIfAborted();
  const { place, distanceKm } = nearestPlace(placeIndex!, latitude, longitude);
  if (distanceKm > 100) return resolveGlobePin(latitude, longitude, signal);
  // Only nearby selections snap to the named place and use its actual metadata.
  const metadata = await resolveCoordinates(place[2], place[3], signal);
  signal?.throwIfAborted();
  return { ...metadata, name: place[0], country: new Intl.DisplayNames([language], { type: 'region' }).of(place[1]) ?? place[1], selectionDistanceKm: distanceKm, selectionMode: 'nearest-place' };
}
