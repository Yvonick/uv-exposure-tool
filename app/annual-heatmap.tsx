'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { formatHour, uvAtLocalHour, type AnnualPoint } from '@/lib/solar';
import { protectionOutline, UV_COLOR_STOPS, uvColor } from '@/lib/uv-heatmap';
import { ChartHoverSurface, FloatingChartTooltip } from './chart-hover';
import { useLanguage } from './language';

const rows = 288;
const gradient = `linear-gradient(to right, ${UV_COLOR_STOPS.map(({ uv, rgb }) => `rgb(${rgb.join(',')}) ${uv / 11 * 100}%`).join(', ')})`;

export default function AnnualHeatmap({ points, today, year }: { points: AnnualPoint[]; today: number; year: number }) {
  const { t, locale, number, lowWindow } = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [selection, setSelection] = useState<{ day: number; hour: number } | null>(null);
  const outline = useMemo(() => protectionOutline(points), [points]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, month) => ({
    day: (Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / 86_400_000,
    label: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1))),
  })), [year, locale]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const pixels = ctx.createImageData(points.length, rows);
    for (let y = 0; y < rows; y++) {
      const hour = 24 - (y + 0.5) * 24 / rows;
      for (let x = 0; x < points.length; x++) {
        const rgb = uvColor(uvAtLocalHour(points[x], hour));
        const index = (y * points.length + x) * 4;
        pixels.data.set([...rgb, 255], index);
      }
    }
    ctx.putImageData(pixels, 0, 0);
  }, [points]);

  function selectPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setSelection({
      day: Math.max(0, Math.min(points.length - 1, Math.floor((event.clientX - bounds.left) / bounds.width * points.length))),
      hour: Math.max(0, Math.min(24, Math.round((1 - (event.clientY - bounds.top) / bounds.height) * 288) / 12)),
    });
  }
  function selectKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') { setSelection(null); return; }
    const current = selection ?? { day: today, hour: 12 };
    setSelection({
      day: Math.max(0, Math.min(points.length - 1, event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : current.day + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0))),
      hour: Math.max(0, Math.min(24, current.hour + (event.key === 'ArrowUp' ? 0.5 : event.key === 'ArrowDown' ? -0.5 : 0))),
    });
  }
  const selected = selection && points[selection.day];
  const selectedText = selected && selection ? [
    `${selected.date} · ${formatHour(selection.hour)} · ${t('Theoretical UVI')} ${number(uvAtLocalHour(selected, selection.hour), 1)}`,
    `${lowWindow(selected.lowWindows)} · ${t('UVI below 3')}`,
    `${t('Theoretical UV peak')} · ${number(selected.maxUv, 1)}`,
    `${t('Maximum solar elevation angle')} · ${selected.daylightSolarElevation ? `${number(selected.daylightSolarElevation.max, 1)}°` : t('No daylight')}`,
    t('0° at the horizon · 90° overhead'),
  ].join('. ') : '';

  return <div className="annual-heatmap">
    <div className="heatmap-legend" aria-label={t('Chart legend')}>
      <div className="heatmap-scale">
        <span>{t('UV Index')}</span>
        <div className="heatmap-colours" style={{ background: gradient }}>
          {UV_COLOR_STOPS.map(({ uv }) => <span key={uv} style={{ left: `${uv / 11 * 100}%` }}>{uv === 11 ? '11+' : uv}</span>)}
        </div>
      </div>
      <span className="heatmap-threshold-key"><i />{t('Outlined area · UVI 3+')}</span>
    </div>
    <ChartHoverSurface>
      <div className="heatmap-frame">
        <div className="heatmap-y-axis" aria-hidden="true">{[0, 6, 12, 18, 24].map(hour => <span key={hour} style={{ top: `${(24 - hour) / 24 * 100}%` }}>{formatHour(hour)}</span>)}</div>
        <div className="heatmap-plot" role="application" tabIndex={0}
          aria-describedby="annual-selection-summary"
          aria-label={t('Annual UV heatmap. Left and right arrows change the day; up and down change the time.')}
          onPointerMove={selectPointer} onPointerDown={selectPointer} onPointerLeave={() => setSelection(null)}
          onFocus={() => setSelection({ day: today, hour: 12 })} onBlur={() => setSelection(null)} onKeyDown={selectKey}>
          <canvas ref={canvas} width={points.length} height={rows} aria-hidden="true" />
          <svg viewBox={`0 0 ${points.length} 24`} preserveAspectRatio="none" aria-hidden="true">
            {[6, 12, 18].map(hour => <path key={hour} d={`M0,${hour}H${points.length}`} className="heatmap-grid" />)}
            <path d={outline} className="heatmap-outline-halo" />
            <path d={outline} className="heatmap-outline" />
            <path d={`M${today + 0.5},0V24`} className="heatmap-today-line" />
          </svg>
          <span className={`heatmap-today ${today > points.length * 0.85 ? 'align-end' : ''}`} style={{ left: `${(today + 0.5) / points.length * 100}%` }}>{t('TODAY')}</span>
          {selection && <span className="heatmap-selection" style={{ left: `${(selection.day + 0.5) / points.length * 100}%`, top: `${(24 - selection.hour) / 24 * 100}%` }} />}
          <span id="annual-selection-summary" className="sr-only" role="status" aria-live="polite">{selectedText}</span>
        </div>
        <div className="heatmap-x-axis" aria-hidden="true">{months.map(({ day, label }, month) => <span key={month} className={month % 3 ? 'heatmap-minor-month' : ''} style={{ left: `${day / points.length * 100}%` }}>{label}</span>)}</div>
      </div>
      {selected && selection && <FloatingChartTooltip>
        <p className="chart-tooltip-date">{selected.date} · {formatHour(selection.hour)}</p>
        <p className="chart-tooltip-main">{t('Theoretical UVI')} · {number(uvAtLocalHour(selected, selection.hour), 1)}</p>
        <p className="chart-tooltip-note">{lowWindow(selected.lowWindows)} · {t('UVI below 3')}</p>
        <p className="chart-tooltip-note">{t('Theoretical UV peak')} · {number(selected.maxUv, 1)}</p>
        <p className="chart-tooltip-note">{t('Maximum solar elevation angle')} · {selected.daylightSolarElevation ? `${number(selected.daylightSolarElevation.max, 1)}°` : t('No daylight')}</p>
        <p className="chart-tooltip-note">{t('0° at the horizon · 90° overhead')}</p>
      </FloatingChartTooltip>}
    </ChartHoverSurface>
  </div>;
}
