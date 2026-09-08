export type Location = {
  name: string; country: string; admin1?: string; latitude: number; longitude: number; timezone: string; elevation: number;
};
export const DEFAULT_LOCATION: Location = {
  name: 'Berlin', country: 'Germany', admin1: 'Berlin', latitude: 52.5244, longitude: 13.4105, timezone: 'Europe/Berlin', elevation: 74,
};
export const formatLocationLabel = (location: Location) => [location.name, location.admin1 && location.admin1 !== location.name ? location.admin1 : null, location.country].filter(Boolean).join(', ');

export function parseCoordinates(query: string): { latitude: number; longitude: number } | null {
  const match = query.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*[,;\s]\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
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
  const location = { name: `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`, country: '', latitude, longitude, timezone: data.timezone!, elevation: data.elevation! };
  coordinateCache.set(key, location);
  return location;
}

export async function lookupLocations(query: string, count = 6, signal?: AbortSignal): Promise<Location[]> {
  const coordinates = parseCoordinates(query);
  if (coordinates) return [await resolveCoordinates(coordinates.latitude, coordinates.longitude, signal)];
  const params = new URLSearchParams({ name: query, count: String(count), language: 'en', format: 'json' });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
  if (!response.ok) throw new Error('Location search is temporarily unavailable. Please try again.');
  const data = await response.json() as { results?: Location[] };
  return (data.results ?? []).filter((r) => validMetadata(r.timezone, r.elevation) && Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && Math.abs(r.latitude) <= 90 && Math.abs(r.longitude) <= 180).map((r) => ({
    name: r.name, country: r.country ?? '', admin1: r.admin1, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone, elevation: r.elevation,
  }));
}

export async function lookupLocation(query: string, signal?: AbortSignal): Promise<Location> {
  const [location] = await lookupLocations(query, 1, signal);
  if (!location) throw new Error('No matching place found. Try a city and country, or latitude, longitude.');
  return location;
}
