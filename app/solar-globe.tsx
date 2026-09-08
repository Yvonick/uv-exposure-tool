'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { Slider } from '@/components/ui/slider';
import { type Location } from '@/lib/locations';
import { dailyModel, daysInYear, formatLowWindow, subsolarPoint, uvAtInstant, wrapLongitude } from '@/lib/solar';
import { project, unproject, visibleLine, nightPath, type GeoPoint } from '@/lib/globe';

type Land = { features: Array<{ geometry: { type: string; coordinates: number[][][] | number[][][][] } }> };
const CENTER = 300, RADIUS = 180;

export default function SolarGlobe({ location, year, onPick }: {
  location: Location; year: number; onPick: (latitude: number, longitude: number) => Promise<Location>;
}) {
  const [day, setDay] = useState(() => Math.floor((Date.now() - Date.UTC(year, 0, 1)) / 86_400_000));
  const [utcMinutes, setUtcMinutes] = useState(720);
  const [view, setView] = useState<GeoPoint>({ latitude: 20, longitude: location.longitude });
  const [lines, setLines] = useState<GeoPoint[][]>([]);
  const [mapError, setMapError] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState('');
  const [pendingPoint, setPendingPoint] = useState<GeoPoint | null>(null);
  const pickSequence = useRef(0);
  const drag = useRef<{ x: number; y: number; view: GeoPoint; moved: boolean } | null>(null);

  useEffect(() => { setView({ latitude: Math.max(-70, Math.min(70, location.latitude)), longitude: location.longitude }); }, [location.latitude, location.longitude]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/data/land.geojson', { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error('Map unavailable');
      return response.json() as Promise<Land>;
    }).then((data) => {
      const rings = data.features.flatMap((feature) => feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates as number[][][]
        : (feature.geometry.coordinates as number[][][][]).flat());
      setLines(rings.map((ring) => ring.map(([longitude, latitude]) => ({ latitude, longitude }))));
    }).catch((error) => { if (error.name !== 'AbortError') setMapError(true); });
    return () => controller.abort();
  }, []);

  const selectedDay = Math.max(0, Math.min(daysInYear(year) - 1, day));
  const instant = useMemo(() => new Date(Date.UTC(year, 0, selectedDay + 1, 0, utcMinutes)), [year, selectedDay, utcMinutes]);
  const calendarParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: location.timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(instant).map((part) => [part.type, part.value]));
  const localDate = new Date(Date.UTC(+calendarParts.year, +calendarParts.month - 1, +calendarParts.day, 12));
  const result = dailyModel(location, localDate);
  const currentUv = uvAtInstant(location, instant);
  const localLabel = new Intl.DateTimeFormat('en-GB', { timeZone: location.timezone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instant);
  const dateLabel = new Intl.DateTimeFormat('en', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(instant);
  const sun = project(subsolarPoint(instant), view);
  const sunAngle = Math.atan2(-sun.y, sun.x) * 180 / Math.PI;
  const sideSun = Math.hypot(sun.x, sun.y) > .12;
  const marker = project(pendingPoint ?? location, view);
  const outline = useMemo(() => lines.map((line) => visibleLine(line, view)).join(''), [lines, view]);
  const grid = useMemo(() => {
    const paths: string[] = [];
    for (const latitude of [-60, -30, 0, 30, 60]) paths.push(visibleLine(Array.from({ length: 181 }, (_, i) => ({ latitude, longitude: -180 + i * 2 })), view));
    for (let longitude = -180; longitude < 180; longitude += 30) paths.push(visibleLine(Array.from({ length: 91 }, (_, i) => ({ latitude: -90 + i * 2, longitude })), view));
    return paths.join('');
  }, [view]);

  async function selectPoint(point: GeoPoint) {
    const sequence = ++pickSequence.current;
    setPendingPoint(point); setPicking(true); setPickError('');
    try { await onPick(Number(point.latitude.toFixed(4)), Number(point.longitude.toFixed(4))); }
    catch (error) { if (sequence === pickSequence.current && (error as Error).name !== 'AbortError') setPickError((error as Error).message); }
    finally { if (sequence === pickSequence.current) { setPicking(false); setPendingPoint(null); } }
  }

  function pointAt(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return unproject((local.x - CENTER) / RADIUS, (CENTER - local.y) / RADIUS, view);
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
    if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
    if (drag.current.moved) setView({ longitude: wrapLongitude(drag.current.view.longitude - dx * .45), latitude: Math.max(-85, Math.min(85, drag.current.view.latitude + dy * .35)) });
  }
  function keyboard(event: KeyboardEvent<SVGSVGElement>) {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(key)) return;
    event.preventDefault();
    if (key === 'Enter' || key === ' ') { void selectPoint(view); return; }
    setView((current) => ({ longitude: wrapLongitude(current.longitude + (key === 'ArrowLeft' ? -15 : key === 'ArrowRight' ? 15 : 0)), latitude: Math.max(-85, Math.min(85, current.latitude + (key === 'ArrowUp' ? 10 : key === 'ArrowDown' ? -10 : 0))) }));
  }

  return (
    <section className="fact-section globe-section" aria-labelledby="globe-title" id="globe">
      <div className="fact-heading"><h2 id="globe-title">Latitude and sunlight</h2></div>
      <div className="fact-content">
        <div className="globe-controls">
          <div><div className="slider-heading"><label id="globe-date-label">Date</label><output>{dateLabel}</output></div><Slider aria-labelledby="globe-date-label" value={[selectedDay]} onValueChange={(value) => setDay(Array.isArray(value) ? value[0] : value)} min={0} max={daysInYear(year) - 1} step={1} /><div className="slider-endpoints"><span>Jan 1</span><span>Dec 31</span></div></div>
          <div><div className="slider-heading"><label id="globe-time-label">Time (UTC)</label><output>{String(Math.floor(utcMinutes / 60)).padStart(2, '0')}:{String(utcMinutes % 60).padStart(2, '0')}</output></div><Slider aria-labelledby="globe-time-label" value={[utcMinutes]} onValueChange={(value) => setUtcMinutes(Array.isArray(value) ? value[0] : value)} min={0} max={1435} step={5} /><div className="slider-endpoints"><span>00:00</span><span>23:55</span></div></div>
        </div>
        <div className="globe-layout">
          <div>
            <svg className="solar-globe" viewBox="0 0 600 600" role="application" aria-label="Interactive globe. Drag to rotate, click to select. Arrow keys rotate; Enter selects the center." tabIndex={0} onKeyDown={keyboard}
              onPointerDown={(event) => { if (!pointAt(event)) return; drag.current = { x: event.clientX, y: event.clientY, view, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={move} onPointerCancel={() => { drag.current = null; }}
              onPointerUp={(event) => { const moved = drag.current?.moved; const started = !!drag.current; drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); if (started && !moved) { const point = pointAt(event); if (point) void selectPoint(point); } }}>
              <defs><radialGradient id="ocean"><stop offset="0" stopColor="#edf5f0" /><stop offset="1" stopColor="#b9d6cb" /></radialGradient><clipPath id="earth-disk"><circle cx={CENTER} cy={CENTER} r={RADIUS} /></clipPath><marker id="sun-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#c19a4d" /></marker></defs>
              {sideSun && <g transform={`translate(${CENTER},${CENTER}) rotate(${sunAngle})`} aria-hidden="true"><circle cx="264" cy="0" r="13" fill="#e6bb69" />{[-60, -30, 0, 30, 60].map((offset) => <line key={offset} x1="237" x2={Math.sqrt(RADIUS ** 2 - offset ** 2) + 4} y1={offset} y2={offset} stroke="#c19a4d" strokeWidth="1.5" markerEnd="url(#sun-arrow)" />)}</g>}
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#ocean)" stroke="#6b9484" />
              <g clipPath="url(#earth-disk)" aria-hidden="true"><path d={grid} fill="none" stroke="#729686" strokeWidth=".65" opacity=".5" /><path d={outline} fill="none" stroke="#3c705b" strokeWidth="1.2" strokeLinejoin="round" /><path d={nightPath(sun)} transform={`translate(${CENTER},${CENTER}) rotate(${sunAngle})`} fill="#182d3c" opacity=".65" /></g>
              {[60, 30, 0, -30, -60].map((latitude) => { const p = project({ latitude, longitude: view.longitude }, view); return p.z > .2 ? <text key={latitude} x={CENTER + 7} y={CENTER - RADIUS * p.y - 5} className="globe-latitude" aria-hidden="true">{latitude === 0 ? 'Equator' : `${Math.abs(latitude)}°${latitude > 0 ? 'N' : 'S'}`}</text> : null; })}
              {marker.z >= 0 && <g aria-hidden="true"><circle cx={CENTER + RADIUS * marker.x} cy={CENTER - RADIUS * marker.y} r="6" fill={picking ? '#b48439' : '#ae553a'} stroke="#fff" strokeWidth="2" /></g>}
              <path d={`M${CENTER - 5},${CENTER}h10M${CENTER},${CENTER - 5}v10`} stroke="#3d5349" strokeWidth=".8" opacity=".6" aria-hidden="true" />
              {!sideSun && <text x="300" y="70" textAnchor="middle" className="globe-sun-caption">{sun.z > 0 ? 'Sunlight from the viewer’s direction' : 'Sunlight from behind the globe'}</text>}
            </svg>
            <div className="globe-navigation"><button type="button" onClick={() => setView((v) => ({ ...v, longitude: wrapLongitude(v.longitude - 45) }))} aria-label="Rotate globe west">←</button><span>Drag to rotate · click a place</span><button type="button" onClick={() => setView((v) => ({ ...v, longitude: wrapLongitude(v.longitude + 45) }))} aria-label="Rotate globe east">→</button></div>
            {mapError && <p className="fact-note">Coastlines could not load. Coordinates can still be selected.</p>}
          </div>
          <div className="globe-results" aria-live="polite" aria-busy={picking}>
            <p className="globe-place">{location.name}</p><p className="globe-local">{localLabel} · local time</p>
            {picking && <p className="fact-note">Resolving elevation and local time…</p>}
            {pickError && <p className="globe-error" role="alert">{pickError}</p>}
            <div className="peak-stat"><span>Theoretical UV now</span><strong>{currentUv.toFixed(1)}</strong></div>
            <div className="peak-stat"><span>Theoretical UV peak</span><strong>{result.maxUv.toFixed(1)}</strong><small>Selected local day</small></div>
            <div className="peak-stat window-stat"><span>Low-UV window</span><strong>{formatLowWindow(result.lowWindows)}</strong><small>UVI below 3 · local time</small></div>
          </div>
        </div>
        <p className="fact-note">Direct rays produce stronger UV than grazing rays. Elevation {Math.round(location.elevation)} m · UV adjustment {location.elevation >= 0 ? '+' : ''}{(location.elevation / 100).toFixed(1)}% (about +10% per km). Clear sky, fixed ozone; low UV does not mean zero risk.</p>
        <details className="evidence"><summary>Sources and model</summary><div className="evidence-content"><p className="fact-note">Solar geometry: <a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF" target="_blank" rel="noreferrer">NOAA</a>. UV: <a href="https://pubmed.ncbi.nlm.nih.gov/18028230/" target="_blank" rel="noreferrer">Madronich</a>. Altitude: <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-%28uv%29" target="_blank" rel="noreferrer">WHO</a> and <a href="https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-77uvindex_mini.html" target="_blank" rel="noreferrer">JMA</a> give approximate rules; actual mountain conditions vary. Elevation: <a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noreferrer">Copernicus / Open-Meteo</a>. Coastlines: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth, public domain</a>. The globe’s clock is UTC; results use the selected place’s local date and time. Dates use the {year} calendar.</p></div></details>
      </div>
    </section>
  );
}
