export type SolarLocation = { latitude: number; longitude: number; elevation: number; timezone: string };
export type Interval = [number, number];
export type DailyModel = {
  maxUv: number; solarNoon: number; protectionWindows: Interval[]; lowWindows: Interval[];
};
export type AnnualPoint = DailyModel & {
  day: number; date: string; base: number; protection: number; secondBase: number; secondProtection: number;
  start: number | null; end: number | null;
};

const radians = Math.PI / 180;
export const wrapLongitude = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
export const daysInYear = (year: number) => (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
export const altitudeFactor = (elevation: number) => 1 + 0.1 * elevation / 1000;

// NOAA fractional-year solar equations; longitude is positive east.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function solarTerms(date: Date) {
  const year = date.getUTCFullYear();
  const day = (Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) - Date.UTC(year, 0, 1)) / 86_400_000;
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const gamma = 2 * Math.PI / daysInYear(year) * (day + (hour - 12) / 24);
  const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  return { equationOfTime, declination };
}

export function timezoneOffsetMinutes(date: Date, timezone: string) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+values.year, +values.month - 1, +values.day, +values.hour, +values.minute);
  return (asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000;
}

export function subsolarPoint(date: Date) {
  const { declination, equationOfTime } = solarTerms(date);
  return {
    latitude: declination / radians,
    longitude: wrapLongitude((720 - date.getUTCHours() * 60 - date.getUTCMinutes() - equationOfTime) / 4),
  };
}

export function uvAtInstant(location: SolarLocation, date: Date) {
  const sun = subsolarPoint(date);
  const phi = location.latitude * radians;
  const dec = sun.latitude * radians;
  const cosine = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos((location.longitude - sun.longitude) * radians);
  return 12.5 * altitudeFactor(location.elevation) * Math.max(0, cosine) ** 2.42;
}

// date encodes the selected local calendar day at UTC noon. Times are local civil hours.
export function dailyModel(location: SolarLocation, date: Date): DailyModel {
  const { declination, equationOfTime } = solarTerms(date);
  const phi = location.latitude * radians;
  const a = Math.sin(phi) * Math.sin(declination);
  const b = Math.cos(phi) * Math.cos(declination);
  const scale = 12.5 * altitudeFactor(location.elevation);
  const maxUv = scale * Math.max(0, a + b) ** 2.42;
  const minUv = scale * Math.max(0, a - b) ** 2.42;
  const solarNoon = ((720 - 4 * location.longitude - equationOfTime + timezoneOffsetMinutes(date, location.timezone)) / 60 % 24 + 24) % 24;
  if (maxUv < 3) return { maxUv, solarNoon, protectionWindows: [], lowWindows: [[0, 24]] };
  if (minUv >= 3 || Math.abs(b) < 1e-12) return { maxUv, solarNoon, protectionWindows: [[0, 24]], lowWindows: [] };
  const cosine = Math.max(-1, Math.min(1, ((3 / scale) ** (1 / 2.42) - a) / b));
  const halfWidth = Math.acos(cosine) * 12 / Math.PI;
  const protectionWindows: Interval[] = [];
  for (const shift of [-24, 0, 24]) {
    const start = Math.max(0, solarNoon - halfWidth + shift);
    const end = Math.min(24, solarNoon + halfWidth + shift);
    if (end > start) protectionWindows.push([start, end]);
  }
  protectionWindows.sort((left, right) => left[0] - right[0]);
  const lowWindows: Interval[] = [];
  let previous = 0;
  for (const [start, end] of protectionWindows) {
    if (start > previous) lowWindows.push([previous, start]);
    previous = end;
  }
  if (previous < 24) lowWindows.push([previous, 24]);
  return { maxUv, solarNoon, protectionWindows, lowWindows };
}

export function buildAnnualData(location: SolarLocation, year: number): AnnualPoint[] {
  return Array.from({ length: daysInYear(year) }, (_, day) => {
    const date = new Date(Date.UTC(year, 0, day + 1, 12));
    const model = dailyModel(location, date);
    const [first, second] = model.protectionWindows;
    return { ...model, day, date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date),
      base: first?.[0] ?? 0, protection: first ? first[1] - first[0] : 0,
      secondBase: second?.[0] ?? 0, secondProtection: second ? second[1] - second[0] : 0,
      start: first?.[0] ?? null, end: first?.[1] ?? null };
  });
}

export function formatHour(value: number | null) {
  if (value === null) return 'none';
  const minutes = Math.max(0, Math.min(1440, Math.round(value * 60)));
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function formatLowWindow(windows: Interval[]) {
  if (!windows.length) return 'None';
  if (windows.length === 1 && windows[0][0] === 0 && windows[0][1] === 24) return 'All day';
  return windows.map(([start, end]) => start === 0 ? `Before ${formatHour(end)}` : end === 24 ? `After ${formatHour(start)}` : `${formatHour(start)}–${formatHour(end)}`).join(' · ');
}

export function allDayLowSeason(points: AnnualPoint[]) {
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < points.length; i++) {
    if (points[i].start !== null) continue;
    const start = i;
    while (i + 1 < points.length && points[i + 1].start === null) i++;
    ranges.push([start, i]);
  }
  if (!ranges.length) return 'No all-day low-UV season';
  if (ranges.length === 1 && ranges[0][0] === 0 && ranges[0][1] === points.length - 1) return 'Low UV all year';
  if (ranges.length > 1 && ranges[0][0] === 0 && ranges[ranges.length - 1][1] === points.length - 1) {
    const first = ranges.shift()!;
    ranges[ranges.length - 1][1] = first[1];
  }
  return ranges.map(([start, end]) => `${points[start].date}–${points[end].date}`).join(' · ');
}
