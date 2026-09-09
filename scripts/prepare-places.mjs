// Convert the GeoNames cities5000 UTF-8 extract into a compact, local globe index.
// Download and schema: https://download.geonames.org/export/dump/
// CC BY 4.0; attribution and coverage are in public/data/README.md.
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/prepare-places.mjs path/to/cities5000.txt');
const places = readFileSync(input, 'utf8').trim().split(/\r?\n/).map((line) => {
  const columns = line.split('\t');
  return [columns[1], columns[8], Number(columns[4]), Number(columns[5])];
}).filter(([name, country, latitude, longitude]) => name && /^[A-Z]{2}$/.test(country)
  && Number.isFinite(latitude) && Math.abs(latitude) <= 90
  && Number.isFinite(longitude) && Math.abs(longitude) <= 180);
if (places.length < 50000) throw new Error('The gazetteer is unexpectedly small; check the source file.');
writeFileSync(new URL('../public/data/places.json', import.meta.url), JSON.stringify(places));
console.log(`Prepared ${places.length.toLocaleString('en')} named places.`);
