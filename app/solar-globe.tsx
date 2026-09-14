'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { Slider } from '@/components/ui/slider';
import { type Location } from '@/lib/locations';
import { dailyModel, daysInYear, formatHour, solarElevationAtInstant, localCalendarTime, localDateTimeToInstant, subsolarPoint, uvAtInstant, wrapLongitude } from '@/lib/solar';
import { project, unproject, visibleLine, nightPath, type GeoPoint } from '@/lib/globe';
import { useLanguage } from './language';

type Land = { features: Array<{ geometry: { type: string; coordinates: number[][][] | number[][][][] } }> };
const CENTER = 300, RADIUS = 180;

export default function SolarGlobe({ location, year, onPick }: {
  location: Location; year: number; onPick: (latitude: number, longitude: number) => Promise<Location>;
}) {
  const { locale, t, number, lowWindow } = useLanguage();
  const [selection, setSelection] = useState(() => ({
    day: Math.floor((localCalendarTime(new Date(), location.timezone).date.getTime() - Date.UTC(year, 0, 1)) / 86_400_000),
    minutes: 720,
  }));
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

  const requestedDay = Math.max(0, Math.min(daysInYear(year) - 1, selection.day));
  const instant = useMemo(() => localDateTimeToInstant(new Date(Date.UTC(year, 0, requestedDay + 1, 12)), selection.minutes, location.timezone), [year, requestedDay, selection.minutes, location.timezone]);
  const { date: localDate, minutes: localMinutes } = localCalendarTime(instant, location.timezone);
  const selectedDay = Math.floor((localDate.getTime() - Date.UTC(year, 0, 1)) / 86_400_000);
  const result = dailyModel(location, localDate);
  const currentUv = uvAtInstant(location, instant);
  const solarElevation = solarElevationAtInstant(location, instant);
  const localLabel = new Intl.DateTimeFormat(locale, { timeZone: location.timezone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instant);
  const dateLabel = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(localDate);

  function updateSelection(day: number, minutes: number) {
    const date = new Date(Date.UTC(year, 0, day + 1, 12));
    let resolved = localCalendarTime(localDateTimeToInstant(date, minutes, location.timezone), location.timezone);
    // Skip a missing clock hour in the direction of slider travel, including 30-minute gaps.
    if (day === selectedDay && minutes < localMinutes && resolved.minutes > minutes) {
      resolved = localCalendarTime(localDateTimeToInstant(date, minutes - (resolved.minutes - minutes), location.timezone), location.timezone);
    }
    setSelection({ day: Math.floor((resolved.date.getTime() - Date.UTC(year, 0, 1)) / 86_400_000), minutes: resolved.minutes });
  }
  const sun = project(subsolarPoint(instant), view);
  // Keep SVG serialization stable across server and browser math implementations.
  const sunAngle = Number((Math.atan2(-sun.y, sun.x) * 180 / Math.PI).toFixed(6));
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
      <div className="fact-heading"><h2 id="globe-title">{t("Latitude and sunlight")}</h2></div>
      <div className="fact-content">
        <div className="globe-controls">
          <div><div className="slider-heading"><label id="globe-date-label">{t("Date")}</label><output>{dateLabel}</output></div><Slider aria-labelledby="globe-date-label" aria-valuetext={dateLabel} value={[selectedDay]} onValueChange={(value) => updateSelection(Array.isArray(value) ? value[0] : value, localMinutes)} min={0} max={daysInYear(year) - 1} step={1} /><div className="slider-endpoints"><span>{t("Jan 1")}</span><span>{t("Dec 31")}</span></div></div>
          <div><div className="slider-heading"><label id="globe-time-label">{t("Local time")}</label><output>{formatHour(localMinutes / 60)}</output></div><Slider aria-labelledby="globe-time-label" aria-valuetext={formatHour(localMinutes / 60)} value={[localMinutes]} onValueChange={(value) => updateSelection(selectedDay, Array.isArray(value) ? value[0] : value)} min={0} max={1435} step={5} /><div className="slider-endpoints"><span>00:00</span><span>23:55</span></div></div>
        </div>
        <div className="globe-layout">
          <div className="globe-stage">
            <svg className="solar-globe" viewBox="0 0 600 600" role="application" aria-label={t("Interactive globe. Drag to rotate, click to select. Arrow keys rotate; Enter selects the center.")} tabIndex={0} onKeyDown={keyboard}
              onPointerDown={(event) => { if (!pointAt(event)) return; drag.current = { x: event.clientX, y: event.clientY, view, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={move} onPointerCancel={() => { drag.current = null; }}
              onPointerUp={(event) => { const moved = drag.current?.moved; const started = !!drag.current; drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); if (started && !moved) { const point = pointAt(event); if (point) void selectPoint(point); } }}>
              <defs><radialGradient id="ocean"><stop offset="0" stopColor="#edf5f0" /><stop offset="1" stopColor="#b9d6cb" /></radialGradient><clipPath id="earth-disk"><circle cx={CENTER} cy={CENTER} r={RADIUS} /></clipPath><linearGradient id="sunlight-cone" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="440" y2="0"><stop offset="0" stopColor="#e6ba5f" stopOpacity=".3" /><stop offset=".65" stopColor="#e6ba5f" stopOpacity=".16" /><stop offset="1" stopColor="#e6ba5f" stopOpacity="0" /></linearGradient></defs>
              {sideSun && <path d="M1600,0L0,-185L0,185Z" transform={`translate(${CENTER},${CENTER}) rotate(${sunAngle})`} fill="url(#sunlight-cone)" pointerEvents="none" aria-hidden="true" />}
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#ocean)" stroke="#6b9484" />
              <circle className="globe-focus" cx={CENTER} cy={CENTER} r={RADIUS + 9} aria-hidden="true" />
              <g clipPath="url(#earth-disk)" aria-hidden="true"><path d={grid} fill="none" stroke="#729686" strokeWidth=".65" opacity=".5" /><path d={outline} fill="none" stroke="#3c705b" strokeWidth="1.2" strokeLinejoin="round" /><path d={nightPath(sun)} transform={`translate(${CENTER},${CENTER}) rotate(${sunAngle})`} fill="#182d3c" opacity=".65" /></g>
              {[60, 30, 0, -30, -60].map((latitude) => { const p = project({ latitude, longitude: view.longitude }, view); return p.z > .2 ? <text key={latitude} x={CENTER + 7} y={CENTER - RADIUS * p.y - 5} className="globe-latitude" aria-hidden="true">{latitude === 0 ? t('Equator') : `${Math.abs(latitude)}°${latitude > 0 ? 'N' : 'S'}`}</text> : null; })}
              {marker.z >= 0 && <g aria-hidden="true"><circle cx={CENTER + RADIUS * marker.x} cy={CENTER - RADIUS * marker.y} r="6" fill={picking ? '#b48439' : '#ae553a'} stroke="#fff" strokeWidth="2" /></g>}
              <path d={`M${CENTER - 5},${CENTER}h10M${CENTER},${CENTER - 5}v10`} stroke="#3d5349" strokeWidth=".8" opacity=".6" aria-hidden="true" />
              {!sideSun && <text x="300" y="70" textAnchor="middle" className="globe-sun-caption">{t(sun.z > 0 ? 'Sunlight from the viewer’s direction' : 'Sunlight from behind the globe')}</text>}
            </svg>
            {mapError && <p className="fact-note">{t("Coastlines could not load. Place selection still works.")}</p>}
          </div>
          <div className="globe-results" aria-live="polite" aria-busy={picking}>
            <div className="globe-location">
              <p className="globe-place">{location.name}</p>
              <p className="globe-place-meta">{[location.country, t('{height} m elevation', { height: number(location.elevation) })].filter(Boolean).join(' · ')}</p>
              <p className="globe-local">{localLabel} · {t('local time')}</p>
              {location.selectionDistanceKm !== undefined && <p className="globe-selection-note">{t('Nearest mapped place · {distance} km from your selection', { distance: location.selectionDistanceKm < 1 ? t('less than 1') : number(location.selectionDistanceKm) })}</p>}
            </div>
            {picking && <p className="fact-note globe-status">{t("Finding the nearest town and its elevation…")}</p>}
            {pickError && <p className="globe-error" role="alert">{t(pickError)}</p>}
            <div className="peak-stat"><span>{t("Theoretical UV at the chosen time")}</span><strong>{number(currentUv, 1)}</strong></div>
            <div className={`peak-stat solar-angle-stat${solarElevation === null ? ' nighttime-stat' : ''}`}><span>{t("Sun angle")}</span><strong>{solarElevation === null ? t('Sun below the horizon') : `${number(solarElevation, 1)}°`}</strong><small>{t("0° at the horizon · 90° overhead")}</small></div>
            <div className="peak-stat"><span>{t("Theoretical UV peak")}</span><strong>{number(result.maxUv, 1)}</strong><small>{t("Selected local day")}</small></div>
            <div className="peak-stat window-stat"><span>{t("Low-UV window on the chosen date")}</span><strong>{lowWindow(result.lowWindows)}</strong><small>{t("UVI below 3 · local time")}</small></div>
          </div>
        </div>
        <details className="evidence"><summary>{t("Sources and model")}</summary><div className="evidence-content">
        <p className="fact-note">{t("Solar elevation is the angle above a flat horizon: 0° at the horizon, 90° overhead. The annual minimum and maximum cover daylight only, using the day’s fixed solar declination. Terrain slope and atmospheric refraction are not included.")} <a href="https://gml.noaa.gov/grad/solcalc/glossary.html" target="_blank" rel="noreferrer">NOAA ↗</a></p>
        <p className="fact-note">{t("Direct rays produce stronger UV than grazing rays. The model includes elevation (about +10% UV per km), clear sky and fixed ozone. Low UV does not mean zero risk.")}</p>
        <p className="fact-note globe-index-note">{t("Globe selections use the nearest place in")} <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">{t("GeoNames")}</a>{t("’ town and city index. Results apply to that place; small villages and landmarks may be absent.")} <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">{t("CC BY 4.0")}</a>.</p>
        <p className="fact-note">{t("Solar geometry:")} <a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF" target="_blank" rel="noreferrer">{t("NOAA")}</a>{t(". UV:")} <a href="https://pubmed.ncbi.nlm.nih.gov/18028230/" target="_blank" rel="noreferrer">{t("Madronich")}</a>{t(". Altitude:")} <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-%28uv%29" target="_blank" rel="noreferrer">{t("WHO")}</a> {t("and")} <a href="https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-77uvindex_mini.html" target="_blank" rel="noreferrer">{t("JMA")}</a> {t("give approximate rules; actual mountain conditions vary. Elevation:")} <a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noreferrer">{t("Copernicus / Open-Meteo")}</a>{t(". Coastlines:")} <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">{t("Natural Earth, public domain")}</a>. {t('The date and time controls use the selected place’s local time, including daylight saving. Missing clock times are skipped; repeated times use their first occurrence. Dates use the {year} calendar.', { year })}</p></div></details>
      </div>
    </section>
  );
}
