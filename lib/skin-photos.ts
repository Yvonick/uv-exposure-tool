// Phototypes are taken from the studies' labels, never inferred from these images.
// Original image bytes are preserved. SVG viewports show only a patch of healthy skin.
export const minhoSource = 'https://doi.org/10.6084/m9.figshare.c.7163569';
export const minhoMetadata = 'https://figshare.com/articles/dataset/faces_metadata/25599153';
export const mantriSource = 'https://doi.org/10.1364/BOE.450224';

type Photo = {
  src: string;
  id: string;
  region: string;
  width: number;
  height: number;
  crop: [number, number, number, number];
  displayWidth?: number;
  source: string;
  study: string;
  credit: string;
  license: string;
  licenseUrl: string;
};

const minho = {
  region: 'Cheek',
  source: minhoMetadata,
  study: 'University of Minho',
  credit: 'Gomes, Linhares & Nascimento (2024)',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};

const mantri = {
  region: 'Forearm',
  source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8884230/#g002',
  study: 'Mantri & Jokerst (2022)',
  credit: '2022 Optica Publishing Group',
  license: 'Optica OA · noncommercial reuse',
  licenseUrl: 'https://doi.org/10.1364/OA_License_v2#VOR-OA',
  displayWidth: 160,
};

export const skinPhotos: Record<string, { tone: string; photo?: Photo }> = {
  I: { tone: 'Very fair', photo: {
    ...mantri, id: 'Fig. 2A', src: '/photos/skin-types/mantri-type-I.jpg',
    width: 160, height: 162, crop: [0, 0, 160, 162],
  } },
  II: { tone: 'Fair', photo: {
    ...minho, id: '207', src: '/photos/skin-types/minho-207.jpg',
    width: 618, height: 923, crop: [65, 485, 150, 100],
  } },
  III: { tone: 'Medium', photo: {
    ...minho, id: '208', src: '/photos/skin-types/minho-208.jpg',
    width: 727, height: 1037, crop: [65, 545, 180, 120],
  } },
  IV: { tone: 'Olive / light brown', photo: {
    ...mantri, id: 'Fig. 2B', src: '/photos/skin-types/mantri-type-IV.jpg',
    width: 161, height: 162, crop: [0, 0, 161, 162],
  } },
  V: { tone: 'Brown', photo: {
    ...minho, id: '249', src: '/photos/skin-types/minho-249.jpg',
    width: 710, height: 960, crop: [65, 565, 150, 100],
  } },
  VI: { tone: 'Deep brown', photo: {
    ...minho, id: '282', src: '/photos/skin-types/minho-282.jpg',
    width: 566, height: 748, crop: [65, 425, 135, 90],
  } },
};
