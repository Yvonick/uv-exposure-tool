# UV Exposure Tool

UV Exposure Tool is a yearly UV planner for any location:

- At what times of day is the UV index theoretically below 3 through the year, assuming clear-sky conditions?
- What is the UV index right now, with a compact view of today's modelled conditions?
- How do skin sensitivity, clouds, the atmosphere, ground reflection, latitude, seasons, altitude and duration affect UV exposure?

Location search is the prominent first control, with live place suggestions and the selected location’s clock in 24-hour time. Compact live conditions appear alongside it; the annual chart is the first full-width section.

Five educational sections follow the annual chart. The skin chart compares RIVM's characteristic first-redness dose ranges with the same exposure example used in the duration calculator. It does not predict an individual's threshold or change the UVI 3 guidance. Expandable regional source comparisons distinguish agreement on broad effects from variation in numerical estimates.

Surface reflectance values are approximate bounds or ranges, not personal exposure multipliers. Altitude and exposure-duration sliders are illustrative scenarios; they do not modify the annual model or forecast. Dose is calculated as UV Index × minutes × 0.015 standard erythemal doses (SED), using 1 SED = 100 erythemally weighted J/m². The neutral 1 SED daily reference is specifically attributed to ARPANSA. It is not a per-outing allowance or a no-damage boundary; the page explains the limits and links research and WHO guidance. The calculator does not track a user's accumulated daily dose.

The prototype uses UV forecast data from CAMS Global through [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api), plus Open-Meteo geocoding. Its annual chart combines solar geometry with the clear-sky approximation published by Sasha Madronich:

```text
UVI ≈ 12.5 × cos(solar zenith angle)^2.42 × (ozone / 300 DU)^-1.23
```

The model currently holds ozone at 300 DU and assumes cloud-free, unpolluted conditions, low surface reflection, and near sea level. It is intended for planning and exploration, not as personal medical advice.

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

Evidence reviewed 8 September 2026. Source links and specific findings are also available beside each section on the page.

## Status

The prototype is published with OpenAI Sites at [uv-exposure-tool.yvonichou.chatgpt.site](https://uv-exposure-tool.yvonichou.chatgpt.site).
