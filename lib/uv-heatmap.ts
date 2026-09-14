import type { Interval } from './solar';

// Absolute UVI anchors: never normalize to a location's maximum.
export const UV_COLOR_STOPS = [
  { uv: 0, rgb: [255, 255, 255] },
  { uv: 1, rgb: [104, 174, 222] },
  { uv: 3, rgb: [254, 231, 111] },
  { uv: 6, rgb: [249, 162, 74] },
  { uv: 8, rgb: [225, 75, 56] },
  { uv: 11, rgb: [135, 58, 159] },
] as const;

export function uvColor(value: number): readonly number[] {
  const uv = Math.max(0, Math.min(11, value));
  for (let i = 1; i < UV_COLOR_STOPS.length; i++) {
    const low = UV_COLOR_STOPS[i - 1], high = UV_COLOR_STOPS[i];
    if (uv <= high.uv) {
      const fraction = (uv - low.uv) / (high.uv - low.uv);
      return low.rgb.map((channel, c) => Math.round(channel + fraction * (high.rgb[c] - channel)));
    }
  }
  return UV_COLOR_STOPS[UV_COLOR_STOPS.length - 1].rgb;
}

// Outline the union of daily UVI >= 3 intervals, including polar and midnight cases.
export function protectionOutline(days: { protectionWindows: Interval[] }[]) {
  const segments: string[] = [];
  for (let day = 0; day < days.length; day++) {
    for (const [start, end] of days[day].protectionWindows) {
      segments.push(`M${day},${24 - start}H${day + 1}`, `M${day},${24 - end}H${day + 1}`);
    }
  }
  for (let day = 0; day <= days.length; day++) {
    const left = days[day - 1]?.protectionWindows ?? [];
    const right = days[day]?.protectionWindows ?? [];
    const edges = [...new Set([...left.flat(), ...right.flat()])].sort((a, b) => a - b);
    for (let i = 1; i < edges.length; i++) {
      const middle = (edges[i - 1] + edges[i]) / 2;
      const inside = (windows: Interval[]) => windows.some(([a, b]) => a < middle && middle < b);
      if (inside(left) !== inside(right)) segments.push(`M${day},${24 - edges[i - 1]}V${24 - edges[i]}`);
    }
  }
  return segments.join('');
}
