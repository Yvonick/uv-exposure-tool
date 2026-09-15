import { localCalendarTime, localDateTimeToInstant } from './solar.ts';

export function uvBand(uv: number) {
  if (uv < 3) return { label: 'Low', tone: 'low' };
  if (uv < 6) return { label: 'Moderate', tone: 'moderate' };
  if (uv < 8) return { label: 'High', tone: 'high' };
  if (uv < 11) return { label: 'Very high', tone: 'very-high' };
  return { label: 'Extreme', tone: 'extreme' };
}

// Never round a below-threshold reading into a different displayed category.
export function displayedUv(uv: number) {
  const rounded = Math.round(uv * 10) / 10;
  return uvBand(rounded).tone === uvBand(uv).tone ? rounded : Math.floor(uv * 10) / 10;
}

export function liveSampleStatus(time: string, timezone: string, now: Date, refreshFailed = false) {
  const parts = time.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parts) return { stale: true, sameDay: false };
  const [, year, month, day, hour, minute] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const instant = localDateTimeToInstant(date, hour * 60 + minute, timezone);
  const calendar = localCalendarTime(now, timezone).date;
  const sameDay = calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day;
  return { stale: refreshFailed || !sameDay || now.getTime() - instant.getTime() > 90 * 60_000, sameDay };
}
