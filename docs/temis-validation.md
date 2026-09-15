# TEMIS + seasonal ozone validation — 15 September 2026

This is an implementation check, not an independent validation against UV instruments.

## Sources and numerical checks

- Formula: KNMI/TEMIS v2.x erythemal coefficients (2017 update), checked against the equation figure at https://www.temis.nl/uvradiation/product/uvi-uvd.html.
- At 300 DU, mean Earth–Sun distance, sea level and reference albedo: UVI at solar elevations 0°, 5°, 10°, 20°, 45°, 90° is respectively 0.033081, 0.091153, 0.207623, 0.729124, 4.467990, 11.802915. The daylight model is positive and monotonic down to the horizon. Below-horizon twilight is excluded, explicitly documented.
- Inverse-square Earth–Sun factors in 2026: 1.03425 near 3 January and 0.96743 near 4 July. A 2 km elevation adds 10%, with no adjustment to live data.
- Ozone: 120 KNMI MSR2 months, January 2016 to December 2025, verified from time coordinates and full latitude/longitude arrays, with no missing cells. Exact provenance is recorded in `public/data/ozone-provenance.json`.
- Data reduction: 12 × 91 × 180 nodes; 786,353 bytes of JSON before compression. Interpolation versus the native mean fields: 0.383 DU RMS, 6.063 DU maximum. These are compression/interpolation errors, not scientific uncertainty estimates.
- Tested interpolation at month midpoints, year boundaries, the date line, both poles and leap day. Polar values do not depend on longitude.
- Tested daily peaks, all UVI 3 crossings and 24-hour interval coverage for every day of 2026 in Paris, Nairobi, Quito, Tromsø, both poles and McMurdo. Also checked local date conversion in fractional-offset, daylight-saving and date-line zones using the existing regression suite.

## Representative changes

The previous model used fixed 300 DU, a cosine power approximation and +10% per km. New values use typical seasonal ozone, TEMIS, distance correction and +5% per km. Both are theoretical clear-sky results.

| Location / date in 2026 | Previous peak | New peak | Ozone used | Previous low-UV window | New low-UV window |
|---|---:|---:|---:|---|---|
| Berlin / 21 June | 9.09 | 6.78 | 333.8 DU | Before 08:48; after 17:27 | Before 09:33; after 16:42 |
| Paris / 21 March | 4.54 | 2.94 | 362.2 DU | Before 10:48; after 15:09 | All day |
| Paris / 21 June | 9.81 | 7.42 | 333.9 DU | Before 09:31; after 18:12 | Before 10:13; after 17:31 |
| Nairobi / 21 March | 14.74 | 15.85 | 260.4 DU | Before 08:45; after 16:36 | Before 08:55; after 16:27 |
| Quito / 21 March | 16.06 | 17.53 | 251.2 DU | Before 08:22; after 16:22 | Before 08:31; after 16:13 |
| North Pole, assumed 0 m / 21 June | 1.34 | 0.89 | 336.6 DU | All day | All day |
| South Pole, assumed 0 m / 21 December | 1.34 | 1.17 | 271.6 DU | All day | All day |

Clock times are local. A pole's 0 m pin is an explicit app assumption, not its actual elevation. No snow enhancement is applied. The low-UV threshold remains UVI below 3, not a guarantee of zero risk.
