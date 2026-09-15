import orbit from './data/earth-orbit.json' with { type: 'json' };

// TEMIS v2.x erythemal fit, updated in 2017 (Allaart et al. functional form).
// https://www.temis.nl/uvradiation/product/uvi-uvd.html
// Total ozone in DU; cosine of solar zenith = sine of solar elevation.
// Returns UVI at mean Earth–Sun distance and sea level, reference albedo 0.09.
export function temisUv(cosine: number, ozoneDU: number) {
  if (cosine < -1e-12) return 0; // Twilight is outside this app's daylight model.
  const mu = Math.max(0, Math.min(1, cosine));
  const muX = mu * (1 - 0.2755) + 0.2755;
  const uva = 2.0877 * muX * Math.exp(-1.0597 / muX);
  const x = 1000 * mu / ozoneDU;
  return uva * (0.0477 * x ** 1.6325 + 5.6499 / ozoneDU + 0.0485) / 0.025;
}

// Kepler's equation and TEMIS's published perihelion table (1900–2100).
// https://www.temis.nl/uvradiation/product/ellipse.html
export function earthSunFactor(date: Date) {
  const year = date.getUTCFullYear();
  const entry = orbit[year - 1900];
  // Outside the source table's years, retain a documented mean orbit.
  const [, fractionalDay, eccentricity] = entry?.[0] === year ? entry : [year, 3, 0.0167];
  const perihelion = Date.UTC(year, 0, 1) + (fractionalDay - 1) * 86_400_000;
  const anomaly = 2 * Math.PI * (date.getTime() - perihelion) / (365.259636 * 86_400_000);
  let eccentricAnomaly = anomaly;
  for (let i = 0; i < 6; i++) eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - anomaly) / (1 - eccentricity * Math.cos(eccentricAnomaly));
  return (1 - eccentricity * Math.cos(eccentricAnomaly)) ** -2;
}
