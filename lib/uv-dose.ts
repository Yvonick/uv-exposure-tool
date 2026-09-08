// UVI / 40 = erythemally weighted W/m²; 1 SED = 100 J/m².
// CIE: https://cie.co.at/eilvterm/17-26-069
// JMA: https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-51uvindex_define.html
export function standardErythemalDose(uvIndex: number, minutes: number): number {
  return uvIndex * minutes * 60 / 40 / 100;
}

// A public-guidance reference from ARPANSA, not a no-damage threshold.
export const DAILY_REFERENCE_SED = 1;

// Characteristic MED ranges, RIVM 2023-0426, Table 1 (printed p.17).
// These are reference categories, not individual predictions or safe limits.
export const skinDoseRanges = [
  { type: 'I', response: 'Burns very readily', low: 2, high: 3 },
  { type: 'II', response: 'Burns readily', low: 2.5, high: 3.5 },
  { type: 'III', response: 'Sometimes burns', low: 3, high: 5 },
  { type: 'IV', response: 'Rarely burns', low: 4.5, high: 6 },
  { type: 'V', response: 'Very rarely burns', low: 6, high: 10 },
  { type: 'VI', response: 'Least prone to burning', low: 10, high: 20 },
];
