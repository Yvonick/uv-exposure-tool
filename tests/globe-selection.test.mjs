import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveGlobeLocation, resolveCoordinates } from '../lib/locations.ts';
import { buildAnnualData, uvAtInstant } from '../lib/solar.ts';

const places = [['Nearby town', 'FR', 0, 0], ['Date-line town', 'FJ', 0, -179.9]];
const json = (value) => new Response(JSON.stringify(value));
async function withMetadata(handler, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => url === '/data/places.json' ? json(places) : handler(new URL(url).searchParams, options);
  try { await run(); } finally { globalThis.fetch = originalFetch; }
}

test('globe snaps only within the inclusive 100 km radius and preserves nearby elevation', async () => {
  await withMetadata(() => json({ elevation: 456, timezone: 'Europe/Paris' }), async () => {
    for (const distance of [99.999, 100, 100.001]) {
      const longitude = distance / 6371.0088 * 180 / Math.PI;
      const result = await resolveGlobeLocation(0, longitude);
      if (distance <= 100) {
        assert.equal(result.selectionMode, 'nearest-place');
        assert.equal(result.name, 'Nearby town');
        assert.equal(result.country, 'France');
        assert.equal(result.longitude, 0);
        assert.equal(result.elevation, 456);
        assert.ok(result.selectionDistanceKm <= 100);
      } else {
        assert.equal(result.selectionMode, 'pin');
        assert.equal(result.longitude, longitude);
        assert.equal(result.elevation, 0);
        assert.equal(result.selectionDistanceKm, undefined);
      }
    }
    const acrossDateLine = await resolveGlobeLocation(0, 179.9);
    assert.equal(acrossDateLine.name, 'Date-line town');
    assert.equal(acrossDateLine.longitude, -179.9);
    assert.ok(acrossDateLine.selectionDistanceKm < 25);
  });
});

test('remote pins retain both poles and arbitrary coordinates at zero altitude', async () => {
  await withMetadata((params) => {
    assert.equal(params.get('elevation'), '0');
    return json({ latitude: 80, longitude: 10, elevation: 2500, timezone: 'UTC' });
  }, async () => {
    for (const [latitude, longitude] of [[90, 15], [-90, -170], [12.3456, 40.5678]]) {
      const result = await resolveGlobeLocation(latitude, longitude);
      assert.equal(result.latitude, latitude);
      assert.equal(result.longitude, longitude);
      assert.equal(result.elevation, 0);
      assert.equal(result.selectionMode, 'pin');
      assert.equal(result.country, '');
      assert.equal(result.timezoneFallback, false);
      assert.ok(Number.isFinite(uvAtInstant(result, new Date('2026-06-21T12:00:00Z'))));
      const annual = buildAnnualData(result, 2026);
      assert.ok(annual.every((point) => Number.isFinite(point.maxUv)));
      if (Math.abs(latitude) === 90) {
        assert.ok(annual.some((point) => point.daylightSolarElevation === null));
        assert.ok(annual.some((point) => point.daylightSolarElevation !== null));
      }
    }
  });
});

test('remote pins use resolved local time without changing coordinate-search elevations', async () => {
  await withMetadata(() => json({ elevation: 2100, timezone: 'Asia/Kathmandu' }), async () => {
    const coordinates = await resolveCoordinates(28, 85);
    const pin = await resolveGlobeLocation(28, 85);
    assert.equal(pin.timezone, 'Asia/Kathmandu');
    assert.equal(pin.timezoneFallback, false);
    assert.equal(pin.elevation, 0);
    assert.equal(coordinates.elevation, 2100);
    assert.equal((await resolveCoordinates(28, 85)).elevation, 2100);
  });
});

test('unavailable or invalid remote time-zone data falls back to explicitly flagged UTC', async () => {
  for (const handler of [
    () => new Response('', { status: 500 }),
    () => json({ elevation: 800 }),
    () => json({ timezone: 'Invalid/Zone' }),
    () => { throw new TypeError('Network unavailable'); },
  ]) {
    await withMetadata(handler, async () => {
      const result = await resolveGlobeLocation(90, 0);
      assert.equal(result.latitude, 90);
      assert.equal(result.elevation, 0);
      assert.equal(result.timezone, 'UTC');
      assert.equal(result.timezoneFallback, true);
    });
  }
});

test('cancelled remote selections reject instead of returning a fallback pin', async () => {
  const controller = new AbortController();
  await withMetadata(() => { controller.abort(); throw new DOMException('Cancelled', 'AbortError'); }, async () => {
    await assert.rejects(resolveGlobeLocation(-90, 0, controller.signal), { name: 'AbortError' });
  });
});
