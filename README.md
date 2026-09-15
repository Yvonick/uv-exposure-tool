# UV Exposure Tool

UV Exposure Tool is a yearly UV planner for any location:

- At what times of day is the UV index theoretically below 3 through the year, assuming clear-sky conditions?
- What is the UV index right now, with a compact view of today's modelled conditions?
- How do skin sensitivity, clouds, ground reflection, latitude, seasons and duration affect UV exposure?

Three language versions share the same data and calculations: [English](https://uv-exposure-tool.yvonichou.chatgpt.site/) defaults to London, [French](https://uv-exposure-tool.yvonichou.chatgpt.site/fr) to Paris, and [German](https://uv-exposure-tool.yvonichou.chatgpt.site/de) to Berlin. Flag links at the top open each version with its default city. Each URL renders its own document language, metadata, dates, decimal formatting, chart labels, photo cards and source panels. Place searches request translated names from Open-Meteo; globe country names use the selected language.

Location search supports city/place names and decimal latitude, longitude (for example `52.52, 13.41`). Geocoding retains elevation and timezone; coordinate selection resolves those together before updating the page. Failed or superseded lookups preserve the last valid location. Compact live conditions and a line chart appear alongside the search, with the Open-Meteo / CAMS credit in that section. The line connects estimated hourly means, with a dashed current/forecast portion. The annual chart is the first full-width section, with theoretical peak and the period when UV stays below 3 all day (or no such period).

Four sections follow the annual chart. The skin chart combines UV/time controls (default UVI 3 for 15 minutes), characteristic first-redness ranges and a shared 1 SED daily reference. It does not predict an individual's threshold or change the UVI 3 guidance. The short sky section gives observed cloud metrics; reflection bars run from zero to the maximum, with hatching over the published range. Expandable sources use agency/author names and distinguish agreement on broad effects from variation in numerical estimates. JMA's documented 40–50% UVI enhancement over extensive snowfields is illustrated as UVI 3 → 4.2–4.5; it is not applied as a correction to live values.

The linear UVI explanation sits below the sky metrics. Ground reflection shows only a short bar-chart explanation, with caveats and the snow example inside its source panel. The globe's model explanation and GeoNames attribution are inside its sources panel.

Hover or tap a skin-type label for two fictional portraits, explicitly marked as AI-generated illustrations in all three languages. A single twelve-person studio lineup keeps the framing, backdrop and lighting consistent; complete portrait tiles are shown without extra zoom. The portraits illustrate broad skin-tone descriptions, not clinical phototypes or personal UV thresholds. DermNet supports the descriptions; the dose chart retains its independent scientific sources. Asset provenance and the exact built-in generation prompt are recorded in `public/photos/skin-types/README.md` and `generation-prompt.txt`. Chart hover cards stay clear of the pointer and flip at viewport edges. UV Index is linear: a 10% increase turns UVI 3 into 3.3 and UVI 6 into 6.6; surface reflectance is not itself the percentage increase in UVI.

The globe has local-date and local-time sliders, day/night shading and a soft cone of sunlight entering from offscreen. Drag or use arrow keys to rotate, including to the poles; click a point (or press Enter at the center) to select it. Selections snap to the nearest indexed town or city only within 100 km and use that place's coordinates, elevation and time zone. Otherwise the exact pin is kept at an assumed elevation of 0 m, even on mountains or ice. Remote pins use Open-Meteo's time zone when available; failed lookups fall back to UTC, explicitly labelled in the controls and charts. Missing clock times are skipped and repeated times use their first occurrence. Coordinate searches still retain the requested coordinates and retrieved elevation.

The locally bundled GeoNames cities5000 index loads only on the first globe selection and is reused. It covers towns/cities over 5,000 people and selected administrative seats, rather than every village or landmark. Nearby selections show country, elevation and distance from the click; remote selections show coordinates and the assumed altitude. The selected location is shared across the annual, live and globe views. Globe results show theoretical UV and sun angle at the chosen time and date, the chosen date's peak UV, and low-UV windows. The annual tooltip shows only the maximum daylight sun angle; polar night is labelled as no daylight. Angles are measured above a flat horizon: 0° at the horizon and 90° overhead. Atmospheric refraction and terrain slope are not modelled. The coastline outline is public-domain Natural Earth data; retrieved elevation comes from Copernicus / Open-Meteo. Place-data attribution, license and regeneration instructions are in `public/data/README.md`. The globe and annual chart share the same solar and altitude model, including polar and midnight-wrapping cases.

Dose is calculated as UV Index × minutes × 0.015 standard erythemal doses (SED), using 1 SED = 100 erythemally weighted J/m². The 1 SED daily reference is attributed to ARPANSA and is not scaled by phototype. It is not a per-outing allowance or a no-damage boundary. The calculator does not track a user's accumulated daily dose. Surface reflectance ranges are not personal exposure multipliers or statistical confidence intervals.

Live UV uses CAMS Global through [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api). The theoretical heatmap and globe use the [KNMI/TEMIS v2.x erythemal parameterisation](https://www.temis.nl/uvradiation/product/uvi-uvd.html), with the updated 2017 coefficients and the [Allaart et al. functional form](https://doi.org/10.1017/S1350482703001130):

```text
mu = sin(solar elevation); muX = mu × (1 − 0.2755) + 0.2755
UVA = 2.0877 × muX × exp(−1.0597 / muX)
X = 1000 × mu / ozoneDU
UVI = UVA × (0.0477 × X^1.6325 + 5.6499 / ozoneDU + 0.0485) / 0.025
UVI *= Earth–Sun distance factor × (1 + 0.05 × elevation in km)
```

The daylight formula includes scattered UV at the horizon. Below the geometric horizon the app returns zero; twilight UV is deliberately excluded. The fit retains its reference surface albedo of 0.09 and implicit reference atmosphere, without explicit cloud, snow, variable aerosol or terrain-shadow corrections. The elevation factor is TEMIS's approximately 5% per km, including below-sea-level locations. These assumptions are shown in the model panel and especially limit polar, low-Sun and mountain estimates. Live CAMS values are not modified.

Ozone uses the equal-year mean of each calendar month over **2016–2025**, from [KNMI MSR2](https://doi.org/10.21944/temis-ozone-msr2), whose method is described by [Van der A et al. (2015)](https://doi.org/10.5194/amt-8-3021-2015). All 120 monthly fields were checked. Native 0.5° data is reduced to a 2° global grid, integer DU, with longitude-independent poles. Bilinear spatial interpolation wraps the date line; linear interpolation between the 15th of each month handles leap years and December/January. Each local calendar day uses one ozone value. These are typical seasonal ozone patterns, not UV observations or forecasts for the displayed year.

The compact grid's interpolation error against all 3,119,040 native monthly-mean nodes is 0.383 DU RMS and at most 6.063 DU; this measures data reduction only, not ozone or UV model accuracy. Rebuild with `node scripts/prepare-ozone.mjs`; cached source bytes stay in ignored `work/msr2`. Exact byte ranges, input/output SHA-256 hashes and processing metadata are in `public/data/ozone-provenance.json`. No additional runtime API or dependency is needed.

Earth–Sun distance follows Kepler's equation using the [TEMIS perihelion table](https://www.temis.nl/uvradiation/product/ellipse.html), bundled for 1900–2100. Outside that table, the helper uses a mean orbit (3 January, eccentricity 0.0167); the page currently displays the present calendar year. NOAA solar geometry remains unchanged. Daily UVI 3 crossings are solved from the same monotonic TEMIS curve used for the heatmap, including polar day/night and intervals crossing midnight. The globe uses the actual selected instant for its solar angle, so its instantaneous value can differ slightly from the daily fixed-declination approximation.

Screen readers identify the fictional skin portraits as illustrations. Keyboard globe rotation announces the new view centre in the selected language without adding visible text. Validation notes and representative before/after comparisons are in `docs/temis-validation.md`.

## Why the threshold is 3

The [World Health Organization](https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index) recommends sun protection when the UV Index is 3 or above. The tool therefore calls UVI below 3 a “low-UV window” and avoids presenting it as zero risk.

Individual sensitivity, medications, altitude, snow, water, and unusual ozone conditions can change risk. When UV is 3 or above, WHO guidance recommends using multiple forms of protection rather than sunscreen alone.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Sources

- [WHO: Radiation — the ultraviolet (UV) index](https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index)
- [KNMI/TEMIS: UV calculation and v2.x coefficients](https://www.temis.nl/uvradiation/product/uvi-uvd.html)
- [Allaart et al. (2004): UV model using solar zenith angle and total ozone](https://doi.org/10.1017/S1350482703001130)
- [KNMI MSR2: total ozone reanalysis](https://doi.org/10.21944/temis-ozone-msr2)
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [RIVM: UV radiation and sunscreen products, Table 1](https://www.rivm.nl/bibliotheek/rapporten/2023-0426.pdf#page=19)
- [ARPANSA: UV exposure and dose](https://www.arpansa.gov.au/services/monitoring/ultraviolet-radiation-monitoring/ultraviolet-radiation-dose/ultraviolet)
- [EPA: UV guide](https://www.epa.gov/sites/default/files/documents/uviguide.pdf)
- [MeteoSwiss: UV index](https://www.meteoswiss.admin.ch/weather/weather-and-climate-from-a-to-z/uv-index.html)
- [Hong Kong Observatory: UV information](https://www.hko.gov.hk/en/wxinfo/uvinfo/uvinfo.html)
- [Japan Meteorological Agency: clouds and UV](https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-73uvindex_mini.html)
- [Swiss FOPH: environmental factors and reflection ranges](https://www.bag.admin.ch/fr/rayonnement-solaire)
- [NOAA: solar-position equations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)
- [Copernicus / Open-Meteo: terrain elevation](https://open-meteo.com/en/docs/elevation-api)
- [Natural Earth: public-domain map data](https://www.naturalearthdata.com/about/terms-of-use/)
- [GeoNames: populated places, CC BY 4.0](https://download.geonames.org/export/dump/)
- [Japan Meteorological Agency: reflection and UV Index enhancement](https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-76uvindex_mini.html)

Evidence reviewed 15 September 2026. Source links and specific findings are also available beside each section on the page.

## Model checks

```bash
node --experimental-strip-types --test tests/*.test.mjs
```

Checks cover equinox geometry, sun angles, altitude effects, DST, leap years, polar and midnight-wrapping windows, globe projection at both poles, the inclusive 100 km place threshold, remote pins at 0 m, UTC fallback, date-line lookup, real gazetteer entries, coordinate metadata, cancellation and dose conversion.

## Status

The prototype is published with OpenAI Sites at [uv-exposure-tool.yvonichou.chatgpt.site](https://uv-exposure-tool.yvonichou.chatgpt.site).
