import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { monthlyOzone, seasonalOzone } from '../lib/ozone.ts';
import { temisUv, earthSunFactor } from '../lib/temis.ts';
import { altitudeFactor, buildAnnualData, dailyModel, uvAtLocalHour, uvAtInstant, localDateTimeToInstant } from '../lib/solar.ts';
import { modelNotes, translator } from '../lib/translations.ts';

const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const date = value => new Date(`${value}T12:00:00Z`);

test('TEMIS v2 erythemal equation has the correct units and finite low-angle UV', () => {
  // Reference evaluations of the published v2.x equation at 300 DU, f(D/H/A)=1.
  for (const [elevation, expected] of [[0, .03308117083093643], [5, .09115345783454024],
    [10, .20762345339720997], [20, .7291241508392307], [45, 4.46798973795904], [90, 11.80291458027057]]) {
    close(temisUv(Math.sin(elevation * Math.PI / 180), 300), expected);
  }
  assert.equal(temisUv(-.01, 300), 0);
  for (const ozone of [100, 200, 300, 500]) {
    let previous = -1;
    for (let angle = 0; angle <= 90; angle += .25) {
      const current = temisUv(Math.sin(angle * Math.PI / 180), ozone);
      assert.ok(Number.isFinite(current) && current > previous);
      previous = current;
    }
  }
  assert.ok(temisUv(.5, 200) > temisUv(.5, 300));
  assert.ok(temisUv(.5, 300) > temisUv(.5, 400));
});

test('all 120 source months and bundled grid agree with the recorded provenance', () => {
  const raw = readFileSync(new URL('../lib/data/ozone-climatology.json', import.meta.url));
  const data = JSON.parse(raw);
  const provenance = JSON.parse(readFileSync(new URL('../public/data/ozone-provenance.json', import.meta.url)));
  assert.equal(createHash('sha256').update(raw).digest('hex'), provenance.outputSha256);
  assert.equal(provenance.inputs.length, 120);
  assert.equal(new Set(provenance.inputs.map(v => `${v.year}-${v.month}`)).size, 120);
  assert.deepEqual([data.startYear, data.endYear, data.rows, data.columns], [2016, 2025, 91, 180]);
  assert.equal(data.maps.length, 12);
  for (const map of data.maps) {
    assert.equal(map.length, 91 * 180);
    assert.ok(map.every(v => Number.isInteger(v) && v > 100 && v < 500));
  }
  assert.ok(provenance.spatialApproximation.rootMeanSquareErrorDU < .5);
  assert.ok(provenance.spatialApproximation.maximumErrorDU < 7);
});

test('ozone is continuous through month and year boundaries, poles and the date line', () => {
  for (const latitude of [-90, -80, 0, 52, 90]) for (const month of [0, 2, 9, 11]) {
    close(monthlyOzone(latitude, -180, month), monthlyOzone(latitude, 180, month));
    close(monthlyOzone(latitude, -180 + 1e-7, month), monthlyOzone(latitude, 180 - 1e-7, month), 1e-5);
    const center = new Date(Date.UTC(2026, month, 15, 12));
    close(seasonalOzone(latitude, 17, center), monthlyOzone(latitude, 17, month));
    for (const boundary of [center, new Date(Date.UTC(2026, month, 1))]) {
      close(seasonalOzone(latitude, 17, new Date(+boundary - 1)), seasonalOzone(latitude, 17, new Date(+boundary + 1)), 1e-5);
    }
  }
  for (const pole of [-90, 90]) for (let longitude = -180; longitude <= 180; longitude += 30) {
    close(monthlyOzone(pole, longitude, 9), monthlyOzone(pole, 0, 9));
  }
  assert.ok(monthlyOzone(90, 0, 2) > monthlyOzone(90, 0, 8) + 80);
  assert.ok(monthlyOzone(-90, 0, 9) < monthlyOzone(-90, 0, 0) - 60);
  assert.ok(Number.isFinite(seasonalOzone(50, 0, date('2028-02-29'))));
});

test('Earth–Sun distance and elevation use the documented physical factors', () => {
  close(earthSunFactor(date('2026-01-03')), 1.03425, .00002);
  close(earthSunFactor(date('2026-07-04')), .96743, .00002);
  close(altitudeFactor(2000), 1.1);
  close(altitudeFactor(-400), .98);
});

test('full annual curves and UVI 3 windows agree across climates and hemispheres', () => {
  for (const [latitude, longitude, elevation, timezone] of [
    [48.85, 2.35, 42, 'Europe/Paris'], [-1.29, 36.82, 1795, 'Africa/Nairobi'],
    [-.18, -78.47, 2850, 'America/Guayaquil'], [69.65, 18.96, 0, 'Europe/Oslo'],
    [90, 0, 0, 'UTC'], [-90, 0, 0, 'UTC'], [-77.85, 166.67, 0, 'Antarctica/McMurdo'],
  ]) {
    for (const model of buildAnnualData({ latitude, longitude, elevation, timezone }, 2026)) {
      assert.ok(Number.isFinite(model.maxUv) && model.maxUv >= 0 && model.maxUv < 30);
      close(uvAtLocalHour(model, model.solarNoon), model.maxUv);
      close([...model.lowWindows, ...model.protectionWindows].reduce((sum,[a,b]) => sum+b-a, 0), 24);
      for (const [start, end] of model.protectionWindows) for (const crossing of [start, end].filter(h => h > 0 && h < 24)) {
        close(uvAtLocalHour(model, crossing), 3);
      }
      for (let hour = .25; hour < 24; hour += .5) {
        assert.equal(uvAtLocalHour(model, hour) >= 3, model.protectionWindows.some(([a,b]) => hour >= a && hour <= b));
      }
    }
  }
});

test('instant and daily calculations share seasonal inputs including local date boundaries', () => {
  for (const [latitude, longitude, timezone] of [[0,179,'Pacific/Kiritimati'],[50,15,'Europe/Berlin'],[-78,167,'Antarctica/McMurdo']]) {
    const place = { latitude, longitude, elevation: 0, timezone };
    const day = date('2026-10-15'), model = dailyModel(place, day);
    const instant = localDateTimeToInstant(day, model.solarNoon * 60, timezone);
    // Daily declination is fixed; the globe uses instantaneous declination.
    close(uvAtInstant(place, instant), model.maxUv, .025);
  }
});

test('all new methodology and accessibility messages are translated', () => {
  for (const language of ['fr','de']) {
    const t = translator(language);
    for (const key of [modelNotes.annual,modelNotes.ozone,modelNotes.elevation,modelNotes.modelLimits,
      'Theoretical UV · clear sky · typical seasonal ozone', 'Type {type}: view illustrative portraits',
      'View centred at {latitude}, {longitude}.']) assert.notEqual(t(key), key);
  }
});
