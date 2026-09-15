// Rebuild the bundled seasonal ozone maps from public KNMI MSR2 data.
// Run: node scripts/prepare-ozone.mjs (Node 22+, network required on first run).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readHeader, values } from './netcdf-classic.mjs';

const source = 'https://d1qb6yzwaaq4he.cloudfront.net/protocols/o3field/msr2/MSR-2.nc';
const startYear = 2016, endYear = 2025, step = 2;
const cache = new URL('../work/msr2/', import.meta.url);
mkdirSync(cache, { recursive: true });
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
async function range(start, end, name) {
  const path = new URL(name, cache);
  if (existsSync(path)) return readFileSync(path);
  const response = await fetch(source, { headers: { Range: `bytes=${start}-${end}` }, signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 206, 'Archive must support byte ranges');
  assert.ok(response.headers.get('content-range')?.startsWith(`bytes ${start}-${end}/`));
  const buffer = Buffer.from(await response.arrayBuffer());
  assert.equal(buffer.length, end - start + 1);
  writeFileSync(path, buffer);
  return buffer;
}
const headerBuffer = await range(0, 65535, 'header.bin');
const header = readHeader(headerBuffer);
const field = name => { const value = header.variables.find(v => v.name === name); assert.ok(value); return value; };
const time = field('time'), lat = field('latitude'), lon = field('longitude'), ozone = field('Average_O3_column');
assert.equal(time.attrs.units, 'months since 1960-01-15 00:00:00.0');
assert.equal(ozone.attrs.units, 'Dobson units');
assert.equal(ozone.type, 3);
assert.deepEqual(ozone.dimensions, [0, 2, 1]);
assert.equal(header.dimensions[1].length, 720);
assert.equal(header.dimensions[2].length, 361);
assert.equal(ozone.attrs.scale_factor ?? 1, 1);
assert.equal(ozone.attrs.add_offset ?? 0, 0);
const firstMonth = values(headerBuffer, time.type, 1, time.begin)[0];
const monthly = Array.from({ length: 12 }, () => new Float64Array(361 * 720));
const inputs = [];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < 120) {
    const index = next++, year = startYear + Math.floor(index / 12), month = index % 12;
    const record = (year - 1960) * 12 + month - firstMonth;
    assert.ok(Number.isInteger(record) && record >= 0 && record < header.records);
    const start = time.begin + record * header.recordSize;
    const end = ozone.begin + record * header.recordSize + ozone.size - 1;
    const buffer = await range(start, end, `${year}-${String(month + 1).padStart(2, '0')}.bin`);
    assert.equal(values(buffer, time.type, 1)[0], (year - 1960) * 12 + month);
    const latitudes = values(buffer, lat.type, 361, lat.begin - time.begin);
    const longitudes = values(buffer, lon.type, 720, lon.begin - time.begin);
    assert.deepEqual(latitudes, Array.from({ length: 361 }, (_, i) => -90 + i / 2));
    assert.deepEqual(longitudes, Array.from({ length: 720 }, (_, i) => -179.5 + i / 2));
    for (let i = 0; i < 361 * 720; i++) {
      const value = buffer.readInt16BE(ozone.begin - time.begin + i * 2);
      assert.ok(value >= 50 && value <= 700, `Missing or invalid ozone: ${year}-${month + 1}, cell ${i}, ${value}`);
      monthly[month][i] += value;
    }
    inputs.push({ year, month: month + 1, byteRange: [start, end], sha256: sha256(buffer) });
    if (index % 12 === 11) console.log(`Read ${year}`);
  }
}));
for (const map of monthly) for (let i = 0; i < map.length; i++) map[i] /= 10;

// Retain native grid nodes at 2° spacing; use longitude-independent means at poles.
// Integer DU precision contributes at most 0.5 DU quantisation error.
const rows = 180 / step + 1, columns = 360 / step;
const maps = monthly.map(native => Array.from({ length: rows * columns }, (_, i) => {
  const row = Math.floor(i / columns), col = i % columns;
  const nativeRow = row * step * 2;
  if (row === 0 || row === rows - 1) return Math.round(native.subarray(nativeRow * 720, (nativeRow + 1) * 720).reduce((a, b) => a + b, 0) / 720);
  return Math.round(native[nativeRow * 720 + (col * step * 2 + 719) % 720]);
}));
// Quantify the compact map's spatial interpolation error against all native nodes.
let maxError = 0, squaredError = 0, count = 0;
for (let month = 0; month < 12; month++) for (let y = 0; y < 361; y++) for (let x = 0; x < 720; x++) {
  const fy = y / (step * 2), fx = (x + 1) / (step * 2), y0 = Math.min(rows - 2, Math.floor(fy)), x0 = Math.floor(fx);
  const a = fy - y0, b = fx - x0;
  const at = (row, col) => maps[month][row * columns + col % columns];
  const interpolated = (1-a)*((1-b)*at(y0,x0)+b*at(y0,x0+1)) + a*((1-b)*at(y0+1,x0)+b*at(y0+1,x0+1));
  const error = Math.abs(interpolated - monthly[month][y*720+x]);
  maxError = Math.max(maxError, error); squaredError += error**2; count++;
}
const data = { startYear, endYear, step, rows, columns, units: 'DU', maps };
const json = JSON.stringify(data) + '\n';
mkdirSync(new URL('../lib/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../lib/data/ozone-climatology.json', import.meta.url), json);
const provenance = {
  dataset: 'KNMI Multi-Sensor Reanalysis (MSR2) total ozone',
  doi: 'https://doi.org/10.21944/temis-ozone-msr2',
  paper: 'https://doi.org/10.5194/amt-8-3021-2015',
  source, retrieved: new Date().toISOString().slice(0,10), startYear, endYear,
  method: 'Equal-year mean for each calendar month; 0.5-degree native nodes subsampled to 2 degrees; pole rows averaged over longitude; rounded to 1 DU. Runtime bilinear spatial interpolation and linear time interpolation between monthly centres.',
  headerSha256: sha256(headerBuffer), outputSha256: sha256(json), outputBytes: Buffer.byteLength(json),
  spatialApproximation: { maximumErrorDU: maxError, rootMeanSquareErrorDU: Math.sqrt(squaredError / count), comparedNativeNodes: count },
  inputs: inputs.sort((a,b) => a.year - b.year || a.month - b.month),
};
writeFileSync(new URL('../public/data/ozone-provenance.json', import.meta.url), JSON.stringify(provenance, null, 2) + '\n');
console.log(JSON.stringify({ ...provenance, inputs: `${inputs.length} validated months` }, null, 2));
