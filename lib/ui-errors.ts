const locationMessages = new Set([
  'Use latitude −90 to 90, then longitude −180 to 180.',
  'Invalid coordinates.',
  'Could not resolve elevation and local time. Please try again.',
  'Location search is temporarily unavailable. Please try again.',
  'No matching place found. Try a city and country, or latitude, longitude.',
  'Could not load place names. Please try again or use the location search.',
  'The place index is unavailable. Please use the location search.',
  'The place index is empty. Please try the location search.',
]);
export function locationErrorMessage(error: unknown) {
  return error instanceof Error && locationMessages.has(error.message) ? error.message : 'Location search is temporarily unavailable. Please try again.';
}
