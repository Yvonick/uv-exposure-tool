'use client';

import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
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
  Bar,
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

type Location = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type CurrentUv = {
  time: string;
  uv: number;
  clearSkyUv: number;
  isDay: boolean;
  day: DailyUvPoint[];
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
};

type GeocodingResponse = {
  results?: Array<{
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }>;
};

type AnnualPoint = {
  day: number;
  date: string;
  base: number;
  protection: number;
  start: number | null;
  end: number | null;
  maxUv: number;
};

const DEFAULT_LOCATION: Location = {
  name: 'Berlin',
  country: 'Germany',
  admin1: 'Berlin',
  latitude: 52.5244,
  longitude: 13.4105,
  timezone: 'Europe/Berlin',
};

const chartConfig = {
  protection: {
    label: 'Sun protection recommended',
    color: '#8dac9e',
  },
} satisfies ChartConfig;

const todayChartConfig = {
  pastMeanUv: { label: 'Estimated hourly mean', color: '#5f5f5f' },
  forecastMeanUv: { label: 'Forecast hourly mean', color: '#c4c4c4' },
  peakUv: { label: 'Highest sampled UV', color: '#226047' },
} satisfies ChartConfig;

const monthTicks = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function timezoneOffsetMinutes(date: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const asUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );
    return (asUtc - date.getTime()) / 60_000;
  } catch {
    return 0;
  }
}

function buildAnnualData(location: Location, year: number): AnnualPoint[] {
  const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
  const latitude = (location.latitude * Math.PI) / 180;
  const thresholdUv = 3;
  const thresholdCosine = Math.pow(thresholdUv / 12.5, 1 / 2.42);
  const thresholdElevation = Math.asin(thresholdCosine);

  return Array.from({ length: daysInYear }, (_, day) => {
    const date = new Date(Date.UTC(year, 0, day + 1, 12));
    const gamma = (2 * Math.PI * day) / daysInYear;
    const equationOfTime =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(gamma) -
        0.032077 * Math.sin(gamma) -
        0.014615 * Math.cos(2 * gamma) -
        0.040849 * Math.sin(2 * gamma));
    const declination =
      0.006918 -
      0.399912 * Math.cos(gamma) +
      0.070257 * Math.sin(gamma) -
      0.006758 * Math.cos(2 * gamma) +
      0.000907 * Math.sin(2 * gamma) -
      0.002697 * Math.cos(3 * gamma) +
      0.00148 * Math.sin(3 * gamma);
    const noonCosine = Math.max(
      0,
      Math.sin(latitude) * Math.sin(declination) +
        Math.cos(latitude) * Math.cos(declination),
    );
    const maxUv = 12.5 * Math.pow(noonCosine, 2.42);
    const cosineHourAngle =
      (Math.sin(thresholdElevation) - Math.sin(latitude) * Math.sin(declination)) /
      (Math.cos(latitude) * Math.cos(declination));
    const offset = timezoneOffsetMinutes(date, location.timezone);
    const solarNoon = (720 - 4 * location.longitude - equationOfTime + offset) / 60;

    let start: number | null = null;
    let end: number | null = null;

    if (cosineHourAngle <= -1) {
      start = 0;
      end = 24;
    } else if (cosineHourAngle < 1) {
      const hourAngle = (Math.acos(cosineHourAngle) * 180) / Math.PI;
      start = Math.max(0, solarNoon - hourAngle / 15);
      end = Math.min(24, solarNoon + hourAngle / 15);
    }

    return {
      day,
      date: new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(date),
      base: start ?? 0,
      protection: start === null || end === null ? 0 : end - start,
      start,
      end,
      maxUv,
    };
  });
}

function formatHour(value: number | null) {
  if (value === null) return 'none';
  if (value >= 23.99) return '24:00';
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  const normalizedHours = minutes === 60 ? hours + 1 : hours;
  const normalizedMinutes = minutes === 60 ? 0 : minutes;
  return `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;
}

function uvBand(uv: number) {
  if (uv < 3) return { label: 'Low', action: 'Sunscreen usually not needed', tone: 'low' };
  if (uv < 6) return { label: 'Moderate', action: 'Sun protection recommended', tone: 'moderate' };
  if (uv < 8) return { label: 'High', action: 'Protection is important', tone: 'high' };
  if (uv < 11) return { label: 'Very high', action: 'Extra protection needed', tone: 'very-high' };
  return { label: 'Extreme', action: 'Avoid unprotected exposure', tone: 'extreme' };
}

function formatLocationLabel(location: Location) {
  return [
    location.name,
    location.admin1 && location.admin1 !== location.name ? location.admin1 : null,
    location.country,
  ].filter(Boolean).join(', ');
}

async function lookupLocations(query: string, count = 6, signal?: AbortSignal): Promise<Location[]> {
  const params = new URLSearchParams({ name: query, count: String(count), language: 'en', format: 'json' });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
  if (!response.ok) throw new Error('Location search failed');
  const data = (await response.json()) as GeocodingResponse;
  return (data.results ?? []).map((result) => ({
      name: result.name,
      country: result.country,
      admin1: result.admin1,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    }));
}

async function lookupLocation(query: string): Promise<Location> {
  const [result] = await lookupLocations(query, 1);
  if (!result) throw new Error('No matching place found');
  return result;
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
      forecastMeanUv: phase === 'forecast' ? area : null,
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
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{point.date}</p>
      <p className="chart-tooltip-main">
        {point.start === null
          ? 'Low UV all day'
          : `${formatHour(point.start)}–${formatHour(point.end)} protect`}
      </p>
      <p className="chart-tooltip-note">Clear-sky peak · {point.maxUv.toFixed(1)} UVI</p>
    </div>
  );
}

function DailyTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DailyUvPoint }> }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="chart-tooltip daily-tooltip">
      <p className="chart-tooltip-date">{point.label}</p>
      <p className="chart-tooltip-main">Estimated mean · {point.meanUv.toFixed(1)} UVI</p>
      <p className="chart-tooltip-note">Highest sampled · {point.peakUv.toFixed(1)} UVI</p>
      <p className="chart-tooltip-note">
        {point.phase === 'past' ? 'Completed hour' : point.phase === 'current' ? 'Current hour' : 'Forecast hour'}
      </p>
    </div>
  );
}

export default function Home() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [localTime, setLocalTime] = useState('--:--:--');
  const [current, setCurrent] = useState<CurrentUv | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingUv, setLoadingUv] = useState(true);
  const [error, setError] = useState('');
  const calendarDate = localCalendarDate(location.timezone);
  const year = calendarDate.year;

  const annualData = useMemo(() => buildAnnualData(location, year), [location, year]);
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
        const matches = await lookupLocations(candidate, 6, controller.signal);
        setSuggestions(matches);
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
  }, [query, location]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadUv(showLoader: boolean) {
      if (showLoader) {
        setLoadingUv(true);
        setCurrent(null);
      }
      setError('');
      try {
        const params = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current: 'uv_index,uv_index_clear_sky',
          hourly: 'uv_index',
          forecast_days: '2',
          timezone: 'auto',
        });
        const daylightParams = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current: 'is_day',
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
        const currentTime = data.current.time;
        const exposure = buildHourlyExposure(
          data.hourly.time,
          data.hourly.uv_index,
          currentTime,
          data.current.uv_index,
        );
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
          protectionStart: exposure.protectionStart,
          protectionEnd: exposure.protectionEnd,
        });
      } catch (requestError) {
        if ((requestError as Error).name !== 'AbortError') {
          setError('Live UV is temporarily unavailable. The annual clear-sky view still works.');
        }
      } finally {
        if (showLoader) setLoadingUv(false);
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
            description: 'Find a city or postal code and update the visible UV Exposure Tool dashboard and annual clear-sky chart.',
            inputSchema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  minLength: 2,
                  description: 'A city, city plus country, or postal code.',
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
              const nextLocation = await lookupLocation(candidate.location.trim());
              setLocation(nextLocation);
              setQuery(formatLocationLabel(nextLocation));
              setSuggestions([]);
              setLoadingSuggestions(false);
              setError('');
              return {
                dashboardUpdated: true,
                location: nextLocation.name,
                country: nextLocation.country,
                timezone: nextLocation.timezone,
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
    setQuery(value);
    setSuggestions([]);
    setLoadingSuggestions(candidate.length >= 2 && candidate !== formatLocationLabel(location));
  }

  function chooseLocation(nextLocation: Location) {
    setLocation(nextLocation);
    setQuery(formatLocationLabel(nextLocation));
    setSuggestions([]);
    setLoadingSuggestions(false);
    setError('');
  }

  async function searchLocation(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) return;
    setLoadingLocation(true);
    setError('');
    try {
      const nextLocation = await lookupLocation(trimmedQuery);
      chooseLocation(nextLocation);
    } catch (searchError) {
      setError(
        (searchError as Error).message === 'No matching place found'
          ? 'No matching place found. Try a city plus country or a postal code.'
          : 'Location search is temporarily unavailable. Please try again.',
      );
    } finally {
      setLoadingLocation(false);
    }
  }

  const currentBand = current?.isDay === false
    ? { label: 'Night', action: 'Sun below the horizon', tone: 'night' }
    : uvBand(current?.uv ?? 0);
  const todayScale = dailyUvScale(current?.day ?? []);
  const currentHour = current ? decimalHour(current.time) : 0;

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="UV Exposure Tool home">
          <span>UV EXPOSURE TOOL</span>
        </a>
        <p className="header-note">Current + clear-sky model</p>
        <a className="method-link" href="#method">Method <ArrowRight aria-hidden="true" /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>UV levels by location.</h1>
          <p className="intro">
            Current conditions and estimated low-UV periods throughout the year.
          </p>
        </div>

        <form className="location-search" onSubmit={searchLocation}>
          <label htmlFor="location-search">Enter a location</label>
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
                placeholder="Enter a location"
                autoComplete="off"
                showTrigger={false}
                aria-label="Enter a location"
                aria-busy={loadingSuggestions}
              />
              <ComboboxContent className="location-suggestions">
                <ComboboxEmpty className="location-suggestion-status">
                  {loadingSuggestions
                    ? 'Searching locations…'
                    : query.trim().length < 2
                      ? 'Type at least two characters'
                      : 'No matching locations'}
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
            <Button className="search-button" type="submit" disabled={loadingLocation} aria-label="Find location">
              {loadingLocation ? <LoaderCircle className="spin" /> : <Search />}
            </Button>
          </div>
          <div className="location-meta">
            <p className="location-result">
              <Check aria-hidden="true" /> {formatLocationLabel(location)}
            </p>
            <p className="location-clock"><span>Local time</span><time>{localTime}</time></p>
          </div>
        </form>
      </section>

      {error && <div className="error-banner" role="alert"><Info aria-hidden="true" />{error}</div>}

      <section className="now-grid" aria-label="Live UV conditions">
        <article className={`uv-orb uv-${currentBand.tone}`}>
          <p className="orb-kicker">Current UV estimate</p>
          {loadingUv ? (
            <LoaderCircle className="orb-loader spin" aria-label="Loading current UV" />
          ) : (
            <p className="uv-number">{current?.uv.toFixed(1) ?? '—'}</p>
          )}
          <p className="uv-band">{current ? currentBand.label : 'Unavailable'}</p>
          <p className="updated">Data at {current?.time.slice(11, 16) ?? '—'} · local time {localTime}</p>
        </article>

        <div className="now-insight">
          <div className="now-summary">
            <div>
              <h2>{current ? currentBand.action : 'Current estimate unavailable'}</h2>
              <p className="insight-copy">
                {current && !current.isDay
                  ? `It is night in ${location.name}. Direct solar UV exposure is not expected until daylight.`
                  : current && current.uv < 3
                  ? 'The current modeled UV is below 3, where protection is usually not required for routine time outdoors.'
                  : current
                    ? 'At UV 3 and above, combine shade, clothing, a hat, sunglasses and broad-spectrum sunscreen.'
                    : 'Use the annual model below for a planning view, then check live conditions again before heading out.'}
              </p>
            </div>
            {current && (
              <div className="daily-summary">
                <span>Today’s protection window</span>
                <strong>
                  {current.protectionStart !== null && current.protectionEnd !== null
                    ? `${formatHour(current.protectionStart)}–${formatHour(current.protectionEnd)}`
                    : 'No hourly peak reaches UVI 3'}
                </strong>
                <small>Uses the highest sampled value in each hour, not the mean.</small>
              </div>
            )}
          </div>

          <div className="day-chart-panel">
            <div className="day-chart-header">
              <div>
                <p>Today</p>
                <small>Hourly exposure estimate · local time</small>
              </div>
              <div className="day-legend" aria-label="Daily chart legend">
                <span><i className="mean-bar" /> Mean</span>
                <span><i className="forecast-bar" /> Forecast mean</span>
                <span><i className="peak-dot" /> Highest sample</span>
              </div>
            </div>
            {current?.day.length ? (
              <ChartContainer config={todayChartConfig} className="day-chart" initialDimension={{ width: 620, height: 220 }}>
                <ComposedChart data={current.day} margin={{ top: 18, right: 12, bottom: 4, left: -20 }}>
                  <CartesianGrid vertical={false} stroke="#dedede" strokeDasharray="2 5" />
                  <ReferenceArea y1={0} y2={3} fill="#226047" fillOpacity={0.06} />
                  <ReferenceLine y={3} stroke="#226047" strokeOpacity={0.32} strokeDasharray="3 4" />
                  <XAxis
                    dataKey="midpoint"
                    type="number"
                    domain={[0, 24]}
                    ticks={[0, 4, 8, 12, 16, 20, 24]}
                    tickFormatter={(value) => `${String(value).padStart(2, '0')}:00`}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis domain={[0, todayScale.upper]} ticks={todayScale.ticks} axisLine={false} tickLine={false} />
                  <ReferenceLine
                    x={currentHour}
                    stroke="#226047"
                    strokeDasharray="3 4"
                    label={{ value: 'NOW', position: 'insideTopRight', fill: '#226047', fontSize: 9 }}
                  />
                  <Tooltip content={<DailyTooltip />} cursor={{ fill: '#eeeeee', fillOpacity: 0.55 }} />
                  <Bar dataKey="pastMeanUv" stackId="mean" barSize={14} radius={[3, 3, 0, 0]} fill="#555555" isAnimationActive={false} />
                  <Bar dataKey="forecastMeanUv" stackId="mean" barSize={14} radius={[3, 3, 0, 0]} fill="#c4c4c4" isAnimationActive={false} />
                  <Scatter dataKey="peakUv" fill="#226047" isAnimationActive={false} />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="day-chart-empty">Hourly data unavailable</div>
            )}
            <p className="day-guidance">Bars estimate the mean between hourly samples; dots show the highest sampled value. Protection guidance uses the peak.</p>
            <p className="day-source">CAMS ENSEMBLE via Open-Meteo · hourly model samples, not observations. Shorter changes between samples cannot be recovered.</p>
          </div>
        </div>
      </section>

      <section className="year-section" aria-labelledby="year-title">
        <div className="year-heading">
          <div className="year-title-group">
            <p className="eyebrow coral"><span /> {location.name} · {year}</p>
            <h2 id="year-title">Estimated low-UV windows throughout the year.</h2>
          </div>
          <div className="peak-stat">
            <span>Clear-sky peak</span>
            <strong>{peakPoint.maxUv.toFixed(1)}</strong>
            <small>around {peakPoint.date}</small>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-legend" aria-label="Chart legend">
            <span><i className="legend-low" /> Low UV · protection usually not needed</span>
            <span><i className="legend-protect" /> Protect · UVI 3+</span>
          </div>
          <div className="chart-scroll">
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
                  ticks={monthTicks}
                  tickFormatter={(value) => months[monthTicks.indexOf(value)] ?? ''}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
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
                    label={{ value: 'TODAY', position: 'insideTopRight', fill: '#111111', fontSize: 9 }}
                  />
                )}
                {lowSeasonEnd && (
                  <ReferenceLine
                    x={lowSeasonEnd.day}
                    stroke="#8b8b8b"
                    strokeDasharray="3 4"
                    label={{ value: 'LOW ALL DAY ENDS', position: 'insideBottomRight', fill: '#686868', fontSize: 8 }}
                  />
                )}
                {lowSeasonStart && (
                  <ReferenceLine
                    x={lowSeasonStart.day}
                    stroke="#8b8b8b"
                    strokeDasharray="3 4"
                    label={{ value: 'LOW ALL DAY STARTS', position: 'insideBottomLeft', fill: '#686868', fontSize: 8 }}
                  />
                )}
                <Tooltip content={<AnnualTooltip />} cursor={{ stroke: '#226047', strokeWidth: 1 }} />
                <Area dataKey="base" stackId="uv" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area
                  dataKey="protection"
                  stackId="uv"
                  stroke="none"
                  fill="url(#protectFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
          <div className="year-references" aria-label="Annual chart reference dates">
            {currentAnnualPoint && <span><i className="reference-today" /> Today · {currentAnnualPoint.date}</span>}
            {lowSeasonEnd && <span><i /> Low all day ends · {lowSeasonEnd.date}</span>}
            {lowSeasonStart && <span><i /> Low all day starts · {lowSeasonStart.date}</span>}
          </div>
          <div className="chart-caption">
            <p>Read vertically: white time before or after the green band is the day’s modeled low-UV window.</p>
            <p>Times shown in {location.timezone.replace('_', ' ')}.</p>
          </div>
        </div>
      </section>

      <section className="method-section" id="method">
        <div className="method-copy">
          <h2>Method and limitations.</h2>
          <p>
            “Low UV” means below 3. The annual band uses solar position and a published clear-sky UV formula with a fixed 300 DU ozone column. It assumes clean air, low ground reflection and near sea level, so snow, altitude, unusual ozone, medication and skin sensitivity can change your risk.
          </p>
        </div>
        <div className="sources">
          <p>Sources</p>
          <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index" target="_blank" rel="noreferrer">WHO · UV Index guidance <ArrowRight /></a>
          <a href="https://pubmed.ncbi.nlm.nih.gov/18028230/" target="_blank" rel="noreferrer">Madronich · clear-sky formula <ArrowRight /></a>
          <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer">CAMS / Open-Meteo · UV data <ArrowRight /></a>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span>UV EXPOSURE TOOL</span></a>
        <p>Data: Open-Meteo · {year}</p>
      </footer>
    </main>
  );
}
