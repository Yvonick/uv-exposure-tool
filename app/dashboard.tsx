'use client';

import { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Info,
  LoaderCircle,
  MapPin,
  Search,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Line,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import UvFacts from './uv-facts';
import SolarGlobe from './solar-globe';
import { ChartHoverSurface, FloatingChartTooltip } from './chart-hover';
import { LanguageSwitcher, useLanguage } from './language';
import { defaultLocations } from '@/lib/languages';
import { daylightChartRange, daylightChartTicks } from '@/lib/daylight-chart';
import { buildAnnualData, formatHour, allDayLowSeason, type AnnualPoint } from '@/lib/solar';
import { formatLocationLabel, lookupLocations, lookupLocation, resolveNearestPlace, type Location } from '@/lib/locations';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

type CurrentUv = {
  time: string;
  uv: number;
  clearSkyUv: number;
  isDay: boolean;
  day: DailyUvPoint[];
  dayRange: [number, number];
  protectionStart: number | null;
  protectionEnd: number | null;
};

type DailyUvPoint = {
  midpoint: number;
  startHour: number;
  label: string;
  meanUv: number;
  pastMeanUv: number | null;
  forecastMeanUv: number | null;
  peakUv: number;
  phase: 'past' | 'current' | 'forecast';
};

type LiveUvResponse = {
  current: {
    time: string;
    uv_index: number;
    uv_index_clear_sky: number;
  };
  hourly: {
    time: string[];
    uv_index: Array<number | null>;
  };
};

type DaylightResponse = {
  current?: {
    is_day?: number;
  };
  daily?: {
    time: string[];
    sunrise: Array<string | null>;
    sunset: Array<string | null>;
  };
};

const annualChartStyle = {
  protection: {
    label: 'Sun protection recommended',
    color: '#8dac9e',
  },
} satisfies ChartConfig;

const todayChartStyle = {
  pastMeanUv: { label: 'Estimated hourly mean', color: '#5f5f5f' },
  forecastMeanUv: { label: 'Forecast hourly mean', color: '#c4c4c4' },
  peakUv: { label: 'Highest sampled UV', color: '#226047' },
} satisfies ChartConfig;

function uvBand(uv: number) {
  if (uv < 3) return { label: 'Low', tone: 'low' };
  if (uv < 6) return { label: 'Moderate', tone: 'moderate' };
  if (uv < 8) return { label: 'High', tone: 'high' };
  if (uv < 11) return { label: 'Very high', tone: 'very-high' };
  return { label: 'Extreme', tone: 'extreme' };
}

function formatLocalTime(timezone: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(new Date());
  } catch {
    return '--:--:--';
  }
}

function decimalHour(time: string) {
  const [hours = '0', minutes = '0'] = time.slice(11, 16).split(':');
  return Number(hours) + Number(minutes) / 60;
}

function localCalendarDate(timezone: string) {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const year = Number(values.year);
    const month = Number(values.month);
    const day = Number(values.day);
    return {
      year,
      dayIndex: Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000),
    };
  } catch {
    const year = now.getFullYear();
    return {
      year,
      dayIndex: Math.round((Date.UTC(year, now.getMonth(), now.getDate()) - Date.UTC(year, 0, 1)) / 86_400_000),
    };
  }
}

function dailyUvScale(points: DailyUvPoint[]) {
  const maximum = points.reduce((highest, point) => Math.max(
    highest,
    point.meanUv,
    point.peakUv,
  ), 0);
  const roughMaximum = Math.max(3, Math.ceil(maximum * 1.08));
  const step = roughMaximum <= 5 ? 1 : roughMaximum <= 10 ? 2 : 3;
  const upper = Math.ceil(roughMaximum / step) * step;
  return {
    upper,
    ticks: Array.from({ length: upper / step + 1 }, (_, index) => index * step),
  };
}

function buildHourlyExposure(
  times: string[],
  values: Array<number | null>,
  currentTime: string,
  currentUv: number,
) {
  const currentDate = currentTime.slice(0, 10);
  const startIndex = times.findIndex((time) => time.startsWith(currentDate));
  const currentHour = decimalHour(currentTime);

  if (startIndex < 0) {
    return { points: [] as DailyUvPoint[], protectionStart: null, protectionEnd: null };
  }

  const samples = times
    .slice(startIndex, startIndex + 25)
    .map((time, index) => ({ hour: index, uv: values[startIndex + index] }))
    .filter((sample): sample is { hour: number; uv: number } => sample.uv !== null && sample.uv !== undefined);
  const matchingCurrent = samples.find((sample) => Math.abs(sample.hour - currentHour) < 0.001);

  if (matchingCurrent) {
    matchingCurrent.uv = currentUv;
  } else if (currentHour >= 0 && currentHour <= 24) {
    samples.push({ hour: currentHour, uv: currentUv });
    samples.sort((a, b) => a.hour - b.hour);
  }

  const points = Array.from({ length: 24 }, (_, startHour) => {
    const intervalSamples = samples.filter((sample) => (
      sample.hour >= startHour && sample.hour <= startHour + 1
    ));
    if (intervalSamples.length < 2) return null;

    const area = intervalSamples.slice(0, -1).reduce((total, sample, index) => {
      const next = intervalSamples[index + 1];
      return total + ((sample.uv + next.uv) / 2) * (next.hour - sample.hour);
    }, 0);
    const peakUv = Math.max(...intervalSamples.map((sample) => sample.uv));
    const phase = startHour + 1 <= currentHour
      ? 'past'
      : startHour <= currentHour
        ? 'current'
        : 'forecast';

    return {
      midpoint: startHour + 0.5,
      startHour,
      label: `${formatHour(startHour)}–${formatHour(startHour + 1)}`,
      meanUv: area,
      pastMeanUv: phase === 'forecast' ? null : area,
      forecastMeanUv: phase !== 'past' ? area : null,
      peakUv,
      phase,
    } satisfies DailyUvPoint;
  }).filter((point): point is DailyUvPoint => point !== null);

  const protectionHours = points.filter((point) => point.peakUv >= 3);
  return {
    points,
    protectionStart: protectionHours[0]?.startHour ?? null,
    protectionEnd: protectionHours.length
      ? protectionHours[protectionHours.length - 1].startHour + 1
      : null,
  };
}

function AnnualTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AnnualPoint }> }) {
  const { t, number, lowWindow } = useLanguage();
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <FloatingChartTooltip>
      <p className="chart-tooltip-date">{point.date}</p>
      <p className="chart-tooltip-main">
        {lowWindow(point.lowWindows)} · {t('UVI below 3')}
      </p>
      <p className="chart-tooltip-note">{t('Theoretical UV peak')} · {number(point.maxUv, 1)} {t("UVI")}</p>
      <p className="chart-tooltip-note">{t('Daylight sun angle')} · {point.daylightSolarElevation ? t('min {min}° · max {max}°', { min: number(point.daylightSolarElevation.min, 1), max: number(point.daylightSolarElevation.max, 1) }) : t('No daylight')}</p>
      <p className="chart-tooltip-note">{t('0° at the horizon · 90° overhead')}</p>
    </FloatingChartTooltip>
  );
}

function DailyTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DailyUvPoint }> }) {
  const { t, number } = useLanguage();
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <FloatingChartTooltip className="daily-tooltip">
      <p className="chart-tooltip-date">{point.label}</p>
      <p className="chart-tooltip-main">{t('Estimated mean')} · {number(point.meanUv, 1)} {t("UVI")}</p>
      <p className="chart-tooltip-note">{t('Highest sampled')} · {number(point.peakUv, 1)} {t("UVI")}</p>
      <p className="chart-tooltip-note">
        {t(point.phase === 'past' ? 'Completed hour' : point.phase === 'current' ? 'Current hour' : 'Forecast hour')}
      </p>
    </FloatingChartTooltip>
  );
}

export default function Dashboard() {
  const { language, locale, t, number } = useLanguage();
  const chartConfig = { protection: { ...annualChartStyle.protection, label: t(annualChartStyle.protection.label) } };
  const todayChartConfig = Object.fromEntries(Object.entries(todayChartStyle).map(([key, item]) => [key, { ...item, label: t(item.label) }]));
  const [location, setLocation] = useState<Location>(defaultLocations[language]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, month, 1)))), [locale]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [localTime, setLocalTime] = useState('--:--:--');
  const [current, setCurrent] = useState<CurrentUv | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingUv, setLoadingUv] = useState(true);
  const [error, setError] = useState('');
  const [liveError, setLiveError] = useState('');
  const locationRequest = useRef(0);
  const locationController = useRef<AbortController | null>(null);
  const calendarDate = localCalendarDate(location.timezone);
  const year = calendarDate.year;

  const annualData = useMemo(() => buildAnnualData(location, year, locale), [location, year, locale]);
  const peakPoint = useMemo(
    () => annualData.reduce((peak, point) => (point.maxUv > peak.maxUv ? point : peak)),
    [annualData],
  );
  const lowSeasonEnd = useMemo(
    () => annualData.find((point, index) => (
      index > 0 && annualData[index - 1].start === null && point.start !== null
    )) ?? null,
    [annualData],
  );
  const lowSeasonStart = useMemo(
    () => annualData.find((point, index) => (
      index > 0 && annualData[index - 1].start !== null && point.start === null
    )) ?? null,
    [annualData],
  );
  const currentAnnualPoint = annualData[calendarDate.dayIndex] ?? null;
  const lowSeason = useMemo(() => allDayLowSeason(annualData), [annualData]);
  const annualMonthTicks = useMemo(() => months.map((_, month) => (Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / 86_400_000), [year, months]);

  useEffect(() => () => locationController.current?.abort(), []);

  useEffect(() => {
    const updateClock = () => setLocalTime(formatLocalTime(location.timezone));
    updateClock();
    const interval = window.setInterval(updateClock, 1_000);
    return () => window.clearInterval(interval);
  }, [location.timezone]);

  useEffect(() => {
    const candidate = query.trim();
    if (candidate.length < 2 || candidate === formatLocationLabel(location)) {
      return;
    }

    const controller = new AbortController();
    const debounce = window.setTimeout(async () => {
      try {
        const matches = await lookupLocations(candidate, 6, controller.signal, language);
        if (!controller.signal.aborted) setSuggestions(matches);
      } catch (suggestionError) {
        if ((suggestionError as Error).name !== 'AbortError') setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [query, location, language]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadUv(showLoader: boolean) {
      if (showLoader) {
        setLoadingUv(true);
        setCurrent(null);
      }
      setLiveError('');
      try {
        const params = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current: 'uv_index,uv_index_clear_sky',
          hourly: 'uv_index',
          forecast_days: '2',
          timezone: 'auto',
          domains: 'cams_global',
        });
        const daylightParams = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current: 'is_day',
          daily: 'sunrise,sunset',
          forecast_days: '2',
          timezone: 'auto',
        });
        const [response, daylight] = await Promise.all([
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`, {
            signal: controller.signal,
          }),
          fetch(`https://api.open-meteo.com/v1/forecast?${daylightParams}`, {
            signal: controller.signal,
          })
            .then(async (daylightResponse) => (
              daylightResponse.ok ? await daylightResponse.json() as DaylightResponse : null
            ))
            .catch((daylightError: Error) => {
              if (daylightError.name === 'AbortError') throw daylightError;
              return null;
            }),
        ]);
        if (!response.ok) throw new Error('UV service unavailable');
        const data = (await response.json()) as LiveUvResponse;
        if (!data.current || !Number.isFinite(data.current.uv_index) || !Array.isArray(data.hourly?.time) || !Array.isArray(data.hourly?.uv_index)) {
          throw new Error('UV service returned incomplete data');
        }
        const currentTime = data.current.time;
        const daylightIndex = daylight?.daily?.time?.indexOf(currentTime.slice(0, 10)) ?? -1;
        const exposure = buildHourlyExposure(
          data.hourly.time,
          data.hourly.uv_index,
          currentTime,
          data.current.uv_index,
        );
        if (controller.signal.aborted) return;
        setCurrent({
          time: currentTime,
          uv: data.current.uv_index,
          clearSkyUv: data.current.uv_index_clear_sky,
          isDay: daylight?.current?.is_day === 1
            ? true
            : daylight?.current?.is_day === 0
              ? false
              : data.current.uv_index_clear_sky > 0,
          day: exposure.points,
          dayRange: daylightChartRange(currentTime.slice(0, 10), daylight?.daily?.sunrise?.[daylightIndex], daylight?.daily?.sunset?.[daylightIndex]),
          protectionStart: exposure.protectionStart,
          protectionEnd: exposure.protectionEnd,
        });
      } catch (requestError) {
        if ((requestError as Error).name !== 'AbortError') {
          if (!controller.signal.aborted) setLiveError('Live UV is temporarily unavailable. The theoretical annual view still works.');
        }
      } finally {
        if (showLoader && !controller.signal.aborted) setLoadingUv(false);
      }
    }
    void loadUv(true);
    const refreshInterval = window.setInterval(() => void loadUv(false), 15 * 60 * 1_000);
    return () => {
      window.clearInterval(refreshInterval);
      controller.abort();
    };
  }, [location]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'check_uv_for_location',
            title: 'Check UV for a location',
            description: 'Find a city, place or decimal latitude, longitude and update the UV dashboard with local elevation.',
            inputSchema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  minLength: 2,
                  description: 'A city, place, city plus country, or decimal latitude, longitude.',
                },
              },
              required: ['location'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            async execute(input: unknown) {
              const candidate = input as { location?: unknown };
              if (typeof candidate.location !== 'string' || candidate.location.trim().length < 2) {
                throw new Error('location must be a string with at least two characters');
              }
              const locationQuery = candidate.location.trim();
              const nextLocation = await resolveAndChoose((signal) => lookupLocation(locationQuery, signal, language));
              return {
                dashboardUpdated: true,
                location: nextLocation.name,
                country: nextLocation.country,
                timezone: nextLocation.timezone,
                elevation: nextLocation.elevation,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      // WebMCP is optional and feature-detected.
    }

    return () => lifecycle.abort();
  }, []);

  function updateLocationQuery(value: string) {
    const candidate = value.trim();
    locationController.current?.abort();
    locationRequest.current++;
    setLoadingLocation(false);
    setQuery(value);
    setSuggestions([]);
    setLoadingSuggestions(candidate.length >= 2 && candidate !== formatLocationLabel(location));
  }

  function chooseLocation(nextLocation: Location) {
    locationController.current?.abort();
    locationRequest.current++;
    setLocation(nextLocation);
    setQuery(formatLocationLabel(nextLocation));
    setSuggestions([]);
    setLoadingSuggestions(false);
    setLoadingLocation(false);
    setError('');
  }

  async function resolveAndChoose(resolve: (signal: AbortSignal) => Promise<Location>) {
    locationController.current?.abort();
    const request = ++locationRequest.current;
    const controller = new AbortController();
    locationController.current = controller;
    setLoadingLocation(true);
    setError('');
    try {
      const nextLocation = await resolve(controller.signal);
      if (request !== locationRequest.current || controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      chooseLocation(nextLocation);
      return nextLocation;
    } catch (failure) {
      if (request === locationRequest.current && (failure as Error).name !== 'AbortError') setError((failure as Error).message);
      throw failure;
    } finally {
      if (request === locationRequest.current) setLoadingLocation(false);
    }
  }

  async function searchLocation(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = query.trim();
    if (candidate.length < 2 || candidate === formatLocationLabel(location)) return;
    try { await resolveAndChoose((signal) => lookupLocation(candidate, signal, language)); } catch { /* Error is displayed above. */ }
  }

  const currentBand = current?.isDay === false
    ? { label: 'Night', tone: 'night' }
    : uvBand(current?.uv ?? 0);
  const todayScale = dailyUvScale(current?.day ?? []);
  const currentHour = current ? decimalHour(current.time) : 0;
  const todayRange: [number, number] = current?.dayRange ?? [0, 24];
  const todayPoints = (current?.day ?? []).filter((point) => point.startHour >= todayRange[0] && point.startHour < todayRange[1]);

  return (
    <main className="app-shell">
      <LanguageSwitcher />
      <header className="dashboard-header" id="top">
        <div className="location-heading">
          <div className="title-search">
        <form className="location-search" onSubmit={searchLocation}>
          <label className="location-label" htmlFor="location-search">{t("Enter a location")}</label>
          <div className="search-row">
            <MapPin className="search-pin" aria-hidden="true" />
            <Combobox
              items={suggestions}
              filteredItems={suggestions}
              value={location}
              inputValue={query}
              onInputValueChange={updateLocationQuery}
              onValueChange={(nextLocation) => {
                if (nextLocation) chooseLocation(nextLocation);
              }}
              itemToStringLabel={formatLocationLabel}
              isItemEqualToValue={(a, b) => a.latitude === b.latitude && a.longitude === b.longitude}
              autoHighlight
              filter={null}
            >
              <ComboboxInput
                id="location-search"
                className="location-input"
                placeholder={t("City or place")}
                autoComplete="off"
                showTrigger={false}
                aria-label={t("City, place, or latitude and longitude")}
                aria-busy={loadingSuggestions}
              />
              <ComboboxContent className="location-suggestions">
                <ComboboxEmpty className="location-suggestion-status">
                  {t(loadingSuggestions
                    ? 'Searching locations…'
                    : query.trim().length < 2
                      ? 'Type at least two characters'
                      : 'No matching locations')}
                </ComboboxEmpty>
                <ComboboxList>
                  {suggestions.map((suggestion, index) => (
                    <ComboboxItem
                      key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.name}`}
                      value={suggestion}
                      index={index}
                      className="location-option"
                    >
                      <MapPin aria-hidden="true" />
                      <span>
                        <strong>{suggestion.name}</strong>
                        <small>
                          {[suggestion.admin1, suggestion.country].filter(Boolean).join(', ')}
                        </small>
                      </span>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Button className="search-button" type="submit" disabled={loadingLocation} aria-label={t("Find location")}>
              {loadingLocation ? <LoaderCircle className="spin" /> : <Search />}
            </Button>
          </div>
          <p className="coordinate-hint">{t("Or enter latitude, longitude · e.g. 52.52, 13.41")}</p>
          <div className="location-meta">
            <p className="location-result">
              <Check aria-hidden="true" /> {formatLocationLabel(location)} · {Math.round(location.elevation)} {t("m")} </p>
            <p className="location-clock"><span>{t("Local time")}</span><time>{localTime}</time></p>
          </div>
        </form>
          </div>
        </div>
        <section className="live-compact" aria-label={t("Live UV conditions")}>
          <div className={`live-reading uv-${currentBand.tone}`}>
            <p className="orb-kicker">{t("UV now")}</p>
            {loadingUv ? <LoaderCircle className="spin live-loader" aria-label={t("Loading current UV")} /> : <p className="uv-number">{current ? number(current.uv, 1) : '—'}</p>}
            <p className="uv-band">{t(current ? currentBand.label : 'Unavailable')}</p>
            <p className="updated">{current?.time.slice(11, 16) ?? '—'} {t("· estimate")}</p>
          </div>
          <div className="live-timeline">
            <div className="day-chart-header">
              <p>{t("Today")}</p>
              <div className="day-legend"><span><i className="past-line" /> {t("Past")}</span><span><i className="forecast-line" /> {t("Forecast")}</span><span><i className="peak-dot" /> {t("Highest sample")}</span></div>
            </div>
            {current?.day.length ? (
              <ChartHoverSurface>
              <ChartContainer config={todayChartConfig} className="day-chart" initialDimension={{ width: 440, height: 135 }}>
                <ComposedChart data={todayPoints} margin={{ top: 12, right: 8, bottom: 0, left: -28 }}>
                  <CartesianGrid vertical={false} stroke="#dedede" strokeDasharray="2 5" />
                  <ReferenceArea y1={0} y2={3} fill="#226047" fillOpacity={0.06} />
                  <ReferenceLine y={3} stroke="#226047" strokeOpacity={0.32} strokeDasharray="3 4" />
                  <XAxis
                    dataKey="midpoint"
                    type="number"
                    domain={todayRange}
                    ticks={daylightChartTicks(todayRange)}
                    allowDataOverflow
                    tickFormatter={(value) => `${String(value).padStart(2, '0')}:00`}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis domain={[0, todayScale.upper]} ticks={todayScale.ticks} axisLine={false} tickLine={false} minTickGap={12} />
                  {currentHour >= todayRange[0] && currentHour <= todayRange[1] && <ReferenceLine
                    x={currentHour}
                    stroke="#226047"
                    strokeDasharray="3 4"
                    label={{ value: t('NOW'), position: 'insideTopRight', fill: '#226047', fontSize: 9 }}
                  />}
                  <Tooltip content={<DailyTooltip />} isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }} cursor={{ stroke: '#9aafa3', strokeDasharray: '3 4' }} />
                  <Line type="monotone" dataKey="pastMeanUv" stroke="#507c67" strokeWidth={2} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="forecastMeanUv" stroke="#869c90" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
                  <Scatter dataKey="peakUv" fill="#226047" isAnimationActive={false} />
                </ComposedChart>
              </ChartContainer>
              </ChartHoverSurface>
            ) : (
              <div className="day-chart-empty">{t("Hourly data unavailable")}</div>
            )}
            <a className="live-source" href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer">{t("Data: Open-Meteo / CAMS ↗")}</a>
          </div>
        </section>
      </header>
      {(error || liveError) && <div className="error-banner" role="alert"><Info aria-hidden="true" />{t(error || liveError)}</div>}

      <section className="year-section" aria-labelledby="year-title">
        <div className="year-heading">
          <div className="year-title-group">
            <h1 id="year-title">{t("UV through the year")}</h1>
          </div>
          <div className="year-stats">
            <div className="peak-stat"><span>{t("Theoretical UV peak")}</span><strong>{number(peakPoint.maxUv, 1)}</strong><small>{peakPoint.date} · {year}</small></div>
            <div className="peak-stat window-stat"><span>{t("Low UV all day")}</span><strong>{t(lowSeason === 'Low UV all year' ? 'All year' : lowSeason === 'No all-day low-UV season' ? 'No period this year' : lowSeason)}</strong><small>{t('Theoretical UVI stays below 3')} · {year}</small></div>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-legend" aria-label={t("Chart legend")}>
            <span><i className="legend-low" /> {t("Low UV · below 3")}</span>
            <span><i className="legend-protect" /> {t("Protection recommended · UVI 3+")}</span>
          </div>
          <div className="chart-scroll">
            <ChartHoverSurface>
            <ChartContainer config={chartConfig} className="annual-chart" initialDimension={{ width: 980, height: 400 }}>
              <AreaChart data={annualData} margin={{ top: 18, right: 12, bottom: 10, left: 0 }}>
                <defs>
                  <linearGradient id="protectFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#89aa9a" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#b5c9bf" stopOpacity={0.78} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#dedede" strokeDasharray="2 6" />
                <XAxis
                  dataKey="day"
                  type="number"
                  domain={[0, annualData.length - 1]}
                  ticks={annualMonthTicks}
                  tickFormatter={(value) => months[annualMonthTicks.indexOf(value)] ?? ''}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                  minTickGap={24}
                />
                <YAxis
                  domain={[0, 24]}
                  ticks={[0, 6, 12, 18, 24]}
                  tickFormatter={(value) => `${String(value).padStart(2, '0')}:00`}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                />
                <ReferenceLine y={12} stroke="#226047" strokeOpacity={0.28} strokeDasharray="4 6" />
                {currentAnnualPoint && (
                  <ReferenceLine
                    x={currentAnnualPoint.day}
                    stroke="#111111"
                    strokeWidth={1.4}
                    label={{ value: t('TODAY'), position: currentAnnualPoint.day > annualData.length * 0.85 ? 'insideTopLeft' : 'insideTopRight', fill: '#111111', fontSize: 12 }}
                  />
                )}
                {lowSeasonEnd && (
                  <ReferenceLine
                    x={lowSeasonEnd.day}
                    stroke="#8b8b8b"
                    strokeDasharray="3 4"
                  />
                )}
                {lowSeasonStart && (
                  <ReferenceLine
                    x={lowSeasonStart.day}
                    stroke="#8b8b8b"
                    strokeDasharray="3 4"
                  />
                )}
                <Tooltip content={<AnnualTooltip />} isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }} cursor={{ stroke: '#226047', strokeWidth: 1 }} />
                <Area dataKey="base" stackId="uv" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area
                  dataKey="protection"
                  stackId="uv"
                  stroke="none"
                  fill="url(#protectFill)"
                  isAnimationActive={false}
                />
                <Area dataKey="secondBase" stackId="second" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area dataKey="secondProtection" stackId="second" stroke="none" fill="url(#protectFill)" isAnimationActive={false} />
              </AreaChart>
            </ChartContainer>
            </ChartHoverSurface>
          </div>
          <div className="chart-caption">
            <p>{t('Theoretical daily windows · clear sky')} · {number(location.elevation)} {t("m.")} <a href="#method">{t("Method")}</a></p>
            <p>{t("Local time")}</p>
          </div>
        </div>
      </section>

      <UvFacts />
      <SolarGlobe location={location} year={year} onPick={(latitude, longitude) => resolveAndChoose((signal) => resolveNearestPlace(latitude, longitude, signal, language))} />

      <section className="method-section" id="method">
        <div className="method-copy">
          <h2>{t("Method and sources")}</h2>
          <p> {t("The annual band uses solar position and the Madronich clear-sky formula with a fixed 300 DU ozone column, clean air, low ground reflection and the location’s elevation (approximately +10% UV per kilometre). Low-UV windows mean UVI below 3, not zero risk. It is a theoretical seasonal guide, not a forecast. The compact daily chart uses CAMS Global estimates via Open-Meteo. It focuses on daylight, retaining one complete nighttime hour before sunrise and after sunset; polar conditions or unavailable sunrise/sunset times retain the full day. Its line connects estimated hourly means; the dashed part shows the current and upcoming hours. Dots show the highest available sample in each hour, not a measured hourly maximum. Earlier values are model estimates, not measurements.")} </p>
        </div>
        <div className="sources">
          <a href="https://gml.noaa.gov/grad/solcalc/glossary.html" target="_blank" rel="noreferrer">{t("NOAA · solar angles")} <ArrowRight /></a>

          <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index" target="_blank" rel="noreferrer">{t("WHO · UV Index guidance")} <ArrowRight /></a>
          <a href="https://pubmed.ncbi.nlm.nih.gov/18028230/" target="_blank" rel="noreferrer">{t("Madronich · clear-sky formula")} <ArrowRight /></a>
          <a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noreferrer">{t("Copernicus / Open-Meteo · elevation")} <ArrowRight /></a>
          <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer">{t("CAMS / Open-Meteo · UV data")} <ArrowRight /></a>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span>{t("UV EXPOSURE TOOL")}</span></a>
        <p>{year}</p>
      </footer>
    </main>
  );
}
