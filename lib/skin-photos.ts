// Fictional AI-generated portraits illustrate broad skin-tone descriptions only.
// The faces have no clinical phototype and are not the subjects behind SED data.
export const phototypeSource = 'https://dermnetnz.org/topics/skin-phototype';
export const portraitLineup = {
  src: '/photos/skin-types/ai-portrait-lineup.png',
  width: 1881,
  height: 836,
  columns: 6,
  rows: 2,
};

export const skinPhotos: Record<string, { tone: string; column: number }> = {
  I: { tone: 'Very fair', column: 0 },
  II: { tone: 'Fair', column: 1 },
  III: { tone: 'Medium', column: 2 },
  IV: { tone: 'Olive / light brown', column: 3 },
  V: { tone: 'Brown', column: 4 },
  VI: { tone: 'Deep brown', column: 5 },
};
