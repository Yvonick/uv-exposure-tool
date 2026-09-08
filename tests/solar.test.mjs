import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyModel, buildAnnualData, uvAtInstant, subsolarPoint, formatLowWindow, allDayLowSeason } from '../lib/solar.ts';
import { project, unproject, nightPath, visibleLine } from '../lib/globe.ts';
import { parseCoordinates, resolveCoordinates, lookupLocations } from '../lib/locations.ts';
import { standardErythemalDose } from '../lib/uv-dose.ts';

const berlin = { latitude: 52.5244, longitude: 13.4105, elevation: 74, timezone: 'Europe/Berlin' };
const equator = { latitude: 0, longitude: 0, elevation: 0, timezone: 'UTC' };
const date = (month, day) => new Date(Date.UTC(2026, month - 1, day, 12));
const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

test('known equinox geometry and altitude increase peak and protection duration', () => {
  const low = dailyModel(equator, date(3, 20));
  close(low.maxUv, 12.5, .01);
  close(low.protectionWindows[0][0], 8 + 23 / 60, .03);
  close(low.protectionWindows[0][1], 15 + 53 / 60, .03);
  const high = dailyModel({ ...equator, elevation: 2000 }, date(3, 20));
  close(high.maxUv / low.maxUv, 1.2);
  assert.ok(high.protectionWindows[0][0] < low.protectionWindows[0][0]);
  assert.ok(high.protectionWindows[0][1] > low.protectionWindows[0][1]);
});

test('Berlin seasons, leap year, local DST and eastward longitude', () => {
  assert.equal(formatLowWindow(dailyModel(berlin, date(12, 21)).lowWindows), 'All day');
  const summer = dailyModel(berlin, date(6, 21));
  assert.ok(summer.maxUv > 9 && summer.maxUv < 9.2);
  const local = dailyModel(berlin, date(6, 21));
  const utc = dailyModel({ ...berlin, timezone: 'UTC' }, date(6, 21));
  close(local.solarNoon - utc.solarNoon, 2);
  close(dailyModel(equator, date(3, 20)).solarNoon - dailyModel({ ...equator, longitude: 15 }, date(3, 20)).solarNoon, 1);
  assert.equal(buildAnnualData(berlin, 2028).length, 366);
  assert.match(allDayLowSeason(buildAnnualData(berlin, 2026)), /Oct.*Mar/);
});

test('polar and midnight-wrap windows partition the day without NaN', () => {
  for (const latitude of [-90, -75, 0, 75, 90]) for (const longitude of [-179, 0, 179]) for (const elevation of [-430, 0, 5000]) {
    const model = dailyModel({ ...equator, latitude, longitude, elevation }, date(6, 21));
    close([...model.lowWindows, ...model.protectionWindows].reduce((sum, [a, b]) => sum + b - a, 0), 24);
    for (const [a, b] of [...model.lowWindows, ...model.protectionWindows]) assert.ok(Number.isFinite(a + b) && a >= 0 && b <= 24 && b > a);
  }
  const wrapped = dailyModel({ ...equator, longitude: 179 }, date(3, 20));
  assert.equal(wrapped.protectionWindows.length, 2);
  assert.equal(wrapped.protectionWindows[0][0], 0);
  assert.equal(wrapped.protectionWindows[1][1], 24);
});

test('instant UV follows sunlight, including the nighttime hemisphere', () => {
  const instant = date(3, 20);
  const sun = subsolarPoint(instant);
  close(uvAtInstant({ ...equator, ...sun }, instant), 12.5);
  close(uvAtInstant({ ...equator, latitude: -sun.latitude, longitude: sun.longitude + 180 }, instant), 0);
});

test('globe click inverse round-trips across view centers and clips outside disk', () => {
  for (const center of [{ latitude: 0, longitude: 0 }, { latitude: 65, longitude: 160 }, { latitude: -65, longitude: -170 }]) {
    for (let latitude = -85; latitude <= 85; latitude += 10) for (let longitude = -175; longitude <= 175; longitude += 10) {
      const p = project({ latitude, longitude }, center);
      if (p.z < .01) continue;
      const recovered = unproject(p.x, p.y, center);
      close(recovered.latitude, latitude, 1e-7);
      close(((recovered.longitude - longitude + 540) % 360) - 180, 0, 1e-7);
    }
    assert.equal(unproject(1.1, 0, center), null);
  }
  const path = visibleLine([{ latitude: 0, longitude: -100 }, { latitude: 0, longitude: 0 }, { latitude: 0, longitude: 100 }], { latitude: 0, longitude: 0 });
  assert.ok(path.startsWith('M') && !path.includes('NaN'));
  for (const z of [-1, 0, 1]) assert.ok(!nightPath({ x: Math.sqrt(1 - z * z), y: 0, z }).includes('NaN'));
});

test('coordinate parsing validates latitude first and preserves place queries', () => {
  assert.deepEqual(parseCoordinates(' -33.86, 151.21 '), { latitude: -33.86, longitude: 151.21 });
  assert.deepEqual(parseCoordinates('90 -180'), { latitude: 90, longitude: -180 });
  assert.deepEqual(parseCoordinates('0;0'), { latitude: 0, longitude: 0 });
  assert.equal(parseCoordinates('Berlin, Germany'), null);
  assert.throws(() => parseCoordinates('91,0'));
  assert.throws(() => parseCoordinates('0,-181'));
});

test('coordinate metadata preserves requested location and rejects stale or incomplete responses', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ latitude: 10.1, longitude: 20.1, elevation: 2200, timezone: 'UTC' }));
    const result = await resolveCoordinates(10.1234, 20.1234);
    assert.equal(result.latitude, 10.1234);
    assert.equal(result.longitude, 20.1234);
    assert.equal(result.elevation, 2200);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(resolveCoordinates(10.1234, 20.1234, controller.signal), { name: 'AbortError' });
    globalThis.fetch = async () => new Response(JSON.stringify({ timezone: 'UTC' }));
    await assert.rejects(resolveCoordinates(11, 21), /elevation/);
    globalThis.fetch = async () => new Response(JSON.stringify({ results: [{ name: 'Invalid', latitude: 99, longitude: 0, elevation: 100, timezone: 'UTC' }] }));
    assert.deepEqual(await lookupLocations('Invalid'), []);
  } finally { globalThis.fetch = originalFetch; }
});

test('SED conversions and equal dose examples', () => {
  close(standardErythemalDose(3, 3), .135);
  close(standardErythemalDose(6, 30), 2.7);
  close(standardErythemalDose(3, 60), standardErythemalDose(6, 30));
  close(standardErythemalDose(12, 180), 32.4);
});
