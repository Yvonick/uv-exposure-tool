# UV Exposure Tool

UV Exposure Tool answers two practical questions for any location:

- What is the UV index right now?
- How does UV change across today, from earlier modelled hours through the remaining forecast?
- At what times of day is the UV index theoretically below 3 through the year, assuming clear-sky conditions?

Location search provides live place suggestions, and the selected location’s clock updates in 24-hour time.

The prototype uses UV forecast data from the CAMS ENSEMBLE through [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api), plus Open-Meteo geocoding. Its annual chart combines solar geometry with the clear-sky approximation published by Sasha Madronich:

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

## Status

The prototype is published with OpenAI Sites at [uv-exposure-tool.yvonichou.chatgpt.site](https://uv-exposure-tool.yvonichou.chatgpt.site).
