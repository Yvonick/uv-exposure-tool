# Map data

`land.geojson` contains Natural Earth public-domain coastline outlines.
Source and terms: https://www.naturalearthdata.com/about/terms-of-use/

`places.json` is a compact derivative of the GeoNames `cities5000` extract,
downloaded 9 September 2026. Each tuple is `[name, countryCode, latitude, longitude]`.
It covers towns/cities over 5,000 people and selected administrative seats;
it is not a complete list of villages or landmarks. Globe selection finds the
nearest entry by great-circle distance. Entries within 100 km use that place's
coordinates, with elevation and time zone fetched from Open-Meteo; the distance
from the click is displayed. If no entry is within 100 km, estimates retain the
exact clicked coordinates and assume elevation 0 m. Remote pins resolve their
time zone at those coordinates when possible, with explicitly labelled UTC as
a fallback. The 0 m assumption applies even on mountains or ice. This selection
is shared by the annual, live and globe views.

GeoNames: https://www.geonames.org/
Original data and schema: https://download.geonames.org/export/dump/
License: Creative Commons Attribution 4.0,
https://creativecommons.org/licenses/by/4.0/
Changes: dropped unused fields and converted to JSON; names/coordinates retained.
To regenerate, extract `cities5000.txt` from the source ZIP, then run
`node scripts/prepare-places.mjs path/to/cities5000.txt` from the repository root.
