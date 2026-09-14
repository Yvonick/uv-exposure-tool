import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyModel, uvAtLocalHour } from '../lib/solar.ts';
import { UV_COLOR_STOPS, uvColor, protectionOutline } from '../lib/uv-heatmap.ts';

test('heatmap uses absolute UV colours, with white zero and purple 11+', () => {
  for (const { uv, rgb } of UV_COLOR_STOPS) assert.deepEqual(uvColor(uv), rgb);
  assert.deepEqual(uvColor(-1), uvColor(0));
  assert.deepEqual(uvColor(18), uvColor(11));
  assert.deepEqual(uvColor(4.5), [252, 197, 93]);
});

test('heatmap samples agree with daily peaks and protection boundaries in every season', () => {
  for (const [latitude, longitude, timezone, elevation] of [
    [48.85, 2.35, 'Europe/Paris', 42], [-1.29, 36.82, 'Africa/Nairobi', 1795],
    [69.65, 18.96, 'Europe/Oslo', 0], [90, 0, 'UTC', 0], [-90, 180, 'UTC', 0],
    [66.5, 180, 'UTC', 0],
  ]) {
    for (const month of [0, 2, 5, 8, 11]) {
      const model = dailyModel({ latitude, longitude, timezone, elevation }, new Date(Date.UTC(2026, month, 21, 12)));
      assert.ok(Math.abs(uvAtLocalHour(model, model.solarNoon) - model.maxUv) < 1e-10);
      assert.ok(Math.abs(uvAtLocalHour(model, 0) - uvAtLocalHour(model, 24)) < 1e-10);
      for (const [start, end] of model.protectionWindows) {
        for (const hour of [start, end].filter(h => h > 0 && h < 24)) assert.ok(Math.abs(uvAtLocalHour(model, hour) - 3) < 1e-9);
      }
      for (let hour = 0.125; hour < 24; hour += 0.25) {
        const protectedHour = model.protectionWindows.some(([a, b]) => hour >= a && hour <= b);
        assert.equal(uvAtLocalHour(model, hour) >= 3, protectedHour);
      }
    }
  }
});

test('threshold outlines enclose polar days and midnight intervals without internal seams', () => {
  assert.equal(protectionOutline([{ protectionWindows: [] }]), '');
  assert.equal(protectionOutline([{ protectionWindows: [[0, 24]] }, { protectionWindows: [[0, 24]] }]),
    'M0,24H1M0,0H1M1,24H2M1,0H2M0,24V0M2,24V0');
  const wrapped = protectionOutline([{ protectionWindows: [[0, 3], [21, 24]] }]);
  assert.ok(wrapped.includes('M0,24V21') && wrapped.includes('M0,3V0'));
  assert.ok(!wrapped.includes('NaN'));
});
