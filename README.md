# UV Exposure Tool

UV Exposure Tool is a yearly UV planner for any location:

- At what times of day is the UV index theoretically below 3 through the year, assuming clear-sky conditions?
- What is the UV index right now, with a compact view of today's modelled conditions?
- How do skin sensitivity, clouds, ground reflection, latitude, seasons and duration affect UV exposure?

Three language versions share the same data and calculations: [English](https://uv-exposure-tool.yvonichou.chatgpt.site/) defaults to London, [French](https://uv-exposure-tool.yvonichou.chatgpt.site/fr) to Paris, and [German](https://uv-exposure-tool.yvonichou.chatgpt.site/de) to Berlin. Flag links at the top open each version with its default city. Each URL renders its own document language, metadata, dates, decimal formatting, chart labels, photo cards and source panels. Place searches request translated names from Open-Meteo; globe country names use the selected language.

Location search supports city/place names and decimal latitude, longitude (for example `52.52, 13.41`). Geocoding retains elevation and timezone; coordinate selection resolves those together before updating the page. Failed or superseded lookups preserve the last valid location. Compact live conditions and a line chart appear alongside the search, with the Open-Meteo / CAMS credit in that section. The line connects estimated hourly means, with a dashed current/forecast portion. The annual chart is the first full-width section, with theoretical peak and the period when UV stays below 3 all day (or no such period).

Four sections follow the annual chart. The skin chart combines UV/time controls (default UVI 3 for 15 minutes), characteristic first-redness ranges and a shared 1 SED daily reference. It does not predict an individual's threshold or change the UVI 3 guidance. The short sky section gives observed cloud metrics; reflection bars run from zero to the maximum, with hatching over the published range. Expandable sources use agency/author names and distinguish agreement on broad effects from variation in numerical estimates. JMA's documented 40–50% UVI enhancement over extensive snowfields is illustrated as UVI 3 → 4.2–4.5; it is not applied as a correction to live values.

The linear UVI explanation sits below the sky metrics. Ground reflection shows only a short bar-chart explanation, with caveats and the snow example inside its source panel. The globe's model explanation and GeoNames attribution are inside its sources panel.

Hover or tap a skin-type label for two ordinary portraits, replacing the earlier disease and treatment photographs. The people are cited as illustrative phototype examples by Ochs Dermatology; this is not a clinical assessment of those individuals. Wikimedia Commons photo credits and open licenses are linked in each card and documented in `public/photos/skin-types/README.md`. Lighting and makeup affect appearance, so these are visual examples rather than a way to determine a personal UV threshold. Chart hover cards stay clear of the pointer and flip at viewport edges. UV Index is linear: a 10% increase turns UVI 3 into 3.3 and UVI 6 into 6.6; surface reflectance is not itself the percentage increase in UVI.

The globe has date and UTC-time sliders, day/night shading and a soft cone of sunlight entering from offscreen. Drag or use arrow keys to rotate; click a point (or press Enter at the center) to select the nearest named place in a locally bundled GeoNames cities5000 index. The 69,700-place index loads only on the first selection and is reused. It covers towns/cities over 5,000 people and selected administrative seats, rather than every village or landmark. The page shows country, elevation and distance from the click, and calculates at the named place's coordinates. Results show instantaneous theoretical UV, the local day's maximum, and local low-UV hours. Its coastline outline is public-domain Natural Earth data; elevation comes from Copernicus / Open-Meteo. Place-data attribution, license and regeneration instructions are in `public/data/README.md`. The globe and annual chart share the same solar and altitude model, including polar and midnight-wrapping cases.

Dose is calculated as UV Index × minutes × 0.015 standard erythemal doses (SED), using 1 SED = 100 erythemally weighted J/m². The 1 SED daily reference is attributed to ARPANSA and is not scaled by phototype. It is not a per-outing allowance or a no-damage boundary. The calculator does not track a user's accumulated daily dose. Surface reflectance ranges are not personal exposure multipliers or statistical confidence intervals.

The prototype uses UV forecast data from CAMS Global through [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api), plus Open-Meteo geocoding. Its annual chart combines solar geometry with the clear-sky approximation published by Sasha Madronich:

```text
UVI ≈ 12.5 × max(0, cos(solar zenith angle))^2.42 × (ozone / 300 DU)^-1.23
Theoretical altitude adjustment = 1 + 0.10 × elevation in km
```

The theoretical model holds ozone at 300 DU, assumes clear sky, clean air and low surface reflection, and applies the selected location's elevation to both peak UV and UVI 3 crossings. The 10%/km adjustment is approximate, especially at high elevations. CAMS live data is not multiplied again. This is a theoretical planning model, not a forecast or personal medical advice.

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
- [Madronich (2007): Analytic formula for the clear-sky UV index](https://pubmed.ncbi.nlm.nih.gov/18028230/)
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

Evidence reviewed 9 September 2026. Source links and specific findings are also available beside each section on the page.

## Model checks

```bash
node --experimental-strip-types --test tests/*.test.mjs
```

Checks cover equinox geometry, altitude effects, DST, leap years, polar and midnight-wrapping windows, globe projection, nearest-place lookup across the date line/poles, real gazetteer entries, coordinate metadata, cancellation and dose conversion.

## Status

The prototype is published with OpenAI Sites at [uv-exposure-tool.yvonichou.chatgpt.site](https://uv-exposure-tool.yvonichou.chatgpt.site).
