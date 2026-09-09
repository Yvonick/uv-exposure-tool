// Keep the sunrise/sunset hours and one complete nighttime hour on either side.
// ISO timestamps are already in the location's local time; do not parse in the device timezone.
export function daylightChartRange(date: string, sunrise?: string | null, sunset?: string | null): [number, number] {
  const localHour = (time?: string | null) => {
    if (!time || time.slice(0, 10) !== date) return NaN;
    const match = time.slice(10).match(/^T(\d{2}):(\d{2})(?::\d{2})?$/);
    if (!match || +match[1] > 23 || +match[2] > 59) return NaN;
    return +match[1] + +match[2] / 60;
  };
  const rise = localHour(sunrise), set = localHour(sunset);
  // Keep the whole local day for polar conditions, midnight-spanning daylight or missing data.
  if (!Number.isFinite(rise) || !Number.isFinite(set) || set <= rise) return [0, 24];
  return [Math.max(0, Math.floor(rise) - 1), Math.min(24, Math.ceil(set) + 1)];
}

export function daylightChartTicks([start, end]: [number, number]) {
  const step = Math.max(1, Math.ceil((end - start) / 4));
  const ticks: number[] = [];
  for (let hour = start; hour < end; hour += step) ticks.push(hour);
  ticks.push(end);
  return ticks;
}
