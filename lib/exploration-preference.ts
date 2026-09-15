export const EXPLORATION_COOKIE = 'uv_exploration';
export type Exploration = { dose: { intensity: number; minutes: number }; globe?: { year: number; day: number; minutes: number } };
export const defaultExploration: Exploration = { dose: { intensity: 3, minutes: 15 } };

export function parseExploration(value?: string): Exploration {
  try {
    if (!value || value.length > 1000) return defaultExploration;
    const input = JSON.parse(value);
    const result: Exploration = { dose: { ...defaultExploration.dose } };
    if (Number.isInteger(input.dose?.intensity) && input.dose.intensity >= 1 && input.dose.intensity <= 12
      && Number.isInteger(input.dose?.minutes) && input.dose.minutes >= 1 && input.dose.minutes <= 180) result.dose = input.dose;
    if (Number.isInteger(input.globe?.year) && input.globe.year >= 2000 && input.globe.year <= 2200
      && Number.isInteger(input.globe?.day) && input.globe.day >= 0 && input.globe.day <= 365
      && Number.isInteger(input.globe?.minutes) && input.globe.minutes >= 0 && input.globe.minutes <= 1435) result.globe = input.globe;
    return result;
  } catch { return defaultExploration; }
}
