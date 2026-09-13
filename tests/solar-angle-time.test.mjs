import test from 'node:test';
import assert from 'node:assert/strict';
import { incidenceAtInstant, subsolarPoint, dailyModel, buildAnnualData, uvAtInstant, localCalendarTime, localDateTimeToInstant } from '../lib/solar.ts';

const ground = { latitude: 0, longitude: 0, elevation: 0, timezone: 'UTC' };
const day = (iso) => new Date(`${iso}T12:00:00Z`);
const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('incidence uses horizontal-ground zenith angle and distinguishes night', () => {
  const instant = day('2026-03-20');
  const sun = subsolarPoint(instant);
  close(incidenceAtInstant(sun, instant), 0);
  close(incidenceAtInstant({ latitude: 0, longitude: sun.longitude + 90 }, instant), 90);
  assert.equal(incidenceAtInstant({ latitude: -sun.latitude, longitude: sun.longitude + 180 }, instant), null);
  const place = { ...ground, latitude: 45, longitude: sun.longitude, elevation: 2000 };
  const angle = incidenceAtInstant(place, instant);
  close(uvAtInstant(place, instant), 15 * Math.cos(angle * Math.PI / 180) ** 2.42);
  close(incidenceAtInstant(place, instant), incidenceAtInstant({ ...place, elevation: 0 }, instant));
});

test('annual daylight range includes the horizon except during polar day or night', () => {
  const summer = day('2026-06-21');
  const declination = subsolarPoint(summer).latitude;
  const regular = dailyModel({ ...ground, latitude: 52 }, summer).daylightIncidence;
  close(regular.min, 52 - declination);
  close(regular.max, 90);
  const polarDay = dailyModel({ ...ground, latitude: 75 }, summer).daylightIncidence;
  close(polarDay.min, 75 - declination);
  close(polarDay.max, 180 - 75 - declination);
  assert.equal(dailyModel({ ...ground, latitude: -75 }, summer).daylightIncidence, null);
  const pole = dailyModel({ ...ground, latitude: 90 }, summer).daylightIncidence;
  close(pole.min, pole.max);
  for (const latitude of [-90, -75, 0, 52, 75, 90]) {
    for (const point of buildAnnualData({ ...ground, latitude }, 2028)) {
      if (!point.daylightIncidence) continue;
      const { min, max } = point.daylightIncidence;
      assert.ok(min >= 0 && min <= max && max <= 90);
    }
  }
});

test('local date and time resolve DST, fractional offsets and date-line boundaries', () => {
  for (const [date, minutes, timezone, expected] of [
    ['2026-06-21', 720, 'Europe/Paris', '2026-06-21T10:00:00.000Z'],
    ['2026-12-21', 720, 'Europe/Paris', '2026-12-21T11:00:00.000Z'],
    ['2026-01-01', 15, 'Asia/Kathmandu', '2025-12-31T18:30:00.000Z'],
    ['2026-01-01', 5, 'America/New_York', '2026-01-01T05:05:00.000Z'],
    ['2026-01-01', 720, 'Pacific/Kiritimati', '2025-12-31T22:00:00.000Z'],
    ['2026-12-31', 1435, 'Pacific/Honolulu', '2027-01-01T09:55:00.000Z'],
  ]) {
    const instant = localDateTimeToInstant(day(date), minutes, timezone);
    assert.equal(instant.toISOString(), expected);
    assert.equal(localCalendarTime(instant, timezone).date.toISOString().slice(0, 10), date);
    assert.equal(localCalendarTime(instant, timezone).minutes, minutes);
  }
});

test('clock changes resolve missing times forward and repeated times to the first occurrence', () => {
  const missing = localDateTimeToInstant(day('2026-03-29'), 150, 'Europe/Berlin');
  assert.equal(missing.toISOString(), '2026-03-29T01:30:00.000Z');
  assert.equal(localCalendarTime(missing, 'Europe/Berlin').minutes, 210);
  const repeated = localDateTimeToInstant(day('2026-10-25'), 150, 'Europe/Berlin');
  assert.equal(repeated.toISOString(), '2026-10-25T00:30:00.000Z');
  assert.equal(localCalendarTime(repeated, 'Europe/Berlin').minutes, 150);
  const halfHourGap = localDateTimeToInstant(day('2026-10-04'), 135, 'Australia/Lord_Howe');
  assert.equal(halfHourGap.toISOString(), '2026-10-03T15:45:00.000Z');
  assert.equal(localCalendarTime(halfHourGap, 'Australia/Lord_Howe').minutes, 165);
});
