# Map data

`land.geojson` contains Natural Earth public-domain coastline outlines.
Source and terms: https://www.naturalearthdata.com/about/terms-of-use/

`places.json` is a compact derivative of the GeoNames `cities5000` extract,
downloaded 9 September 2026. Each tuple is `[name, countryCode, latitude, longitude]`.
It covers towns/cities over 5,000 people and selected administrative seats;
it is not a complete list of villages or landmarks. Globe selection finds the
nearest entry by great-circle distance, then fetches elevation and timezone at
that entry's coordinates from Open-Meteo. Estimates use the named place, not the
original clicked point. Distance from the click is displayed on the page.

GeoNames: https://www.geonames.org/
Original data and schema: https://download.geonames.org/export/dump/
License: Creative Commons Attribution 4.0,
https://creativecommons.org/licenses/by/4.0/
Changes: dropped unused fields and converted to JSON; names/coordinates retained.
To regenerate, extract `cities5000.txt` from the source ZIP, then run
`node scripts/prepare-places.mjs path/to/cities5000.txt` from the repository root.
