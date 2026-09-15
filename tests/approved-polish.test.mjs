import test from 'node:test';
import assert from 'node:assert/strict';
import { displayedUv, uvBand, liveSampleStatus } from '../lib/live-status.ts';
import { parseExploration } from '../lib/exploration-preference.ts';
import { parseCoordinates, splitPlaceQuery, lookupLocations } from '../lib/locations.ts';
import { locationErrorMessage } from '../lib/ui-errors.ts';

test('rounded live readings never contradict category boundaries', () => {
  for (const threshold of [3,6,8,11]) {
    const raw = threshold - 0.04;
    assert.equal(displayedUv(raw), threshold - .1);
    assert.equal(uvBand(displayedUv(raw)).tone, uvBand(raw).tone);
    assert.equal(displayedUv(threshold), threshold);
  }
  assert.equal(displayedUv(5.34),5.3);
});

test('failed refreshes, old samples and previous dates are explicitly stale', () => {
  const now = new Date('2026-09-15T12:30:00Z');
  assert.deepEqual(liveSampleStatus('2026-09-15T14:15','Europe/Paris',now),{stale:false,sameDay:true});
  assert.deepEqual(liveSampleStatus('2026-09-15T14:15','Europe/Paris',now,true),{stale:true,sameDay:true});
  assert.equal(liveSampleStatus('2026-09-15T10:00','UTC',now).stale,true);
  assert.deepEqual(liveSampleStatus('2026-09-14T23:45','UTC',new Date('2026-09-15T00:05:00Z')),{stale:true,sameDay:false});
  assert.deepEqual(liveSampleStatus('bad','UTC',now),{stale:true,sameDay:false});
});

test('exploration transfers numeric settings and rejects malformed values', () => {
  const state={dose:{intensity:6,minutes:27},globe:{year:2026,day:274,minutes:575}};
  assert.deepEqual(parseExploration(JSON.stringify(state)),state);
  assert.deepEqual(parseExploration('{'),{dose:{intensity:3,minutes:15}});
  assert.deepEqual(parseExploration(JSON.stringify({dose:{intensity:99,minutes:-3},globe:{year:2026,day:400,minutes:9000}})),{dose:{intensity:3,minutes:15}});
});

test('coordinate input accepts decimal commas only with clear separators', () => {
  for(const text of ['48,85; 2,35','48,85 2,35','48.85, 2.35','48,85; 2.35']) assert.deepEqual(parseCoordinates(text),{latitude:48.85,longitude:2.35});
  assert.deepEqual(parseCoordinates('48,85; 2'),{latitude:48.85,longitude:2});
  assert.deepEqual(parseCoordinates('48; 2,35'),{latitude:48,longitude:2.35});
  assert.equal(parseCoordinates('48,85,2,35'),null);
  assert.throws(()=>parseCoordinates('91,2; 2,35'));
});

test('country fallback uses canonical codes and preserves state-qualified names', () => {
  assert.deepEqual(splitPlaceQuery('London, UK'),{name:'London',countryCode:'GB'});
  assert.deepEqual(splitPlaceQuery('Paris France'),{name:'Paris',countryCode:'FR'});
  assert.deepEqual(splitPlaceQuery('Berlin Allemagne','fr'),{name:'Berlin',countryCode:'DE'});
  for(const name of ['Los Angeles, CA','Atlanta, GA','New Britain','New England']) assert.deepEqual(splitPlaceQuery(name),{name});
});

test('native place lookup takes precedence and empty results use country fallback', async () => {
  const fetchBefore=globalThis.fetch, calls=[];
  const result={name:'London',country:'United Kingdom',latitude:51.5,longitude:0,elevation:20,timezone:'Europe/London'};
  try {
    globalThis.fetch=async url=>{const params=new URL(url).searchParams;calls.push(params);return {ok:true,json:async()=>({results:params.get('countryCode')==='GB'?[result]:[]})};};
    assert.equal((await lookupLocations('London, UK'))[0].name,'London');
    assert.equal(calls[0].get('name'),'London, UK');
    assert.equal(calls[1].get('countryCode'),'GB');
    calls.length=0;
    globalThis.fetch=async url=>{calls.push(new URL(url).searchParams);return {ok:true,json:async()=>({results:[result]})};};
    await lookupLocations('London, UK');
    assert.equal(calls.length,1);
  } finally {globalThis.fetch=fetchBefore;}
});

test('unknown browser errors are replaced with translated application messages', () => {
  assert.equal(locationErrorMessage(new SyntaxError('Unexpected token secret response')),'Location search is temporarily unavailable. Please try again.');
  assert.equal(locationErrorMessage(new Error('Invalid coordinates.')),'Invalid coordinates.');
});
