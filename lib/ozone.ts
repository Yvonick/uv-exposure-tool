import climatology from './data/ozone-climatology.json' with { type: 'json' };

export const ozoneReferencePeriod = `${climatology.startYear}–${climatology.endYear}`;

// Bilinear interpolation on the global 2° grid, including the date-line seam.
// Both pole rows are longitude-independent. Values are total column ozone in DU.
export function monthlyOzone(latitude: number, longitude: number, month: number) {
  const { step, rows, columns, maps } = climatology;
  const y = (Math.max(-90, Math.min(90, latitude)) + 90) / step;
  const x = (((longitude + 180) % 360 + 360) % 360) / step;
  const y0 = Math.min(rows - 2, Math.floor(y)), x0 = Math.floor(x);
  const fy = y - y0, fx = x - x0;
  const map = maps[((month % 12) + 12) % 12];
  const at = (row: number, col: number) => map[row * columns + col % columns];
  return (1 - fy) * ((1 - fx) * at(y0, x0) + fx * at(y0, x0 + 1))
    + fy * ((1 - fx) * at(y0 + 1, x0) + fx * at(y0 + 1, x0 + 1));
}

// The date encodes local calendar fields at UTC noon, as in dailyModel.
// Monthly climatological means are anchored on the 15th; interpolate through
// December/January and leap years without a discontinuity or a daily API call.
export function seasonalOzone(latitude: number, longitude: number, date: Date) {
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  const center = Date.UTC(year, month, 15, 12);
  const firstMonth = date.getTime() < center ? month - 1 : month;
  const first = Date.UTC(year, firstMonth, 15, 12), second = Date.UTC(year, firstMonth + 1, 15, 12);
  const fraction = (date.getTime() - first) / (second - first);
  return monthlyOzone(latitude, longitude, firstMonth) * (1 - fraction)
    + monthlyOzone(latitude, longitude, firstMonth + 1) * fraction;
}
