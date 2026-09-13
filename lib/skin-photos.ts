// Photos are labelled by the cited clinical sources, not classified from appearance here.
const phototype = 'https://dermnetnz.org/topics/skin-phototype';
const naevi = 'https://dermnetnz.org/topics/melanocytic-naevi-in-skin-of-colour-images';
type Photo = { src: string; caption: string; source: string; credit: string };
const dermnet = (src: string, caption: string, source: string, credit = 'DermNet'): Photo => ({ src, caption, source, credit });
export const skinPhotos: Record<string, { tone: string; photos: Photo[]; note?: string }> = {
  I: { tone: 'Very fair', photos: [
    dermnet('/photos/skin-types/type-1-a.jpg', 'Face', phototype),
    dermnet('/photos/skin-types/type-1-b.jpg', 'Back', 'https://dermnetnz.org/imagedetail/8086-fitzpatrick-type-1-skin'),
  ] },
  II: { tone: 'Fair', photos: [
    dermnet('/photos/skin-types/type-2-a.jpg', 'Face', phototype, 'Health New Zealand / DermNet'),
    dermnet('/photos/skin-types/type-2-b.jpg', 'Back', naevi),
  ] },
  III: { tone: 'Medium', photos: [
    dermnet('/photos/skin-types/type-3-a.jpg', 'Forehead', phototype, 'Health New Zealand / DermNet'),
    dermnet('/photos/skin-types/type-3-b.jpg', 'Back', naevi),
  ] },
  IV: { tone: 'Olive / light brown', photos: [
    dermnet('/photos/skin-types/type-4-a.jpg', 'Face', phototype),
    dermnet('/photos/skin-types/type-4-b.jpg', 'Back', naevi),
  ] },
  V: { tone: 'Brown', photos: [
    dermnet('/photos/skin-types/type-5-a.jpg', 'Forehead', phototype, 'Health New Zealand / DermNet'),
    dermnet('/photos/skin-types/type-5-b.jpg', 'Face', naevi),
  ] },
  VI: { tone: 'Deep brown', photos: [
    dermnet('/photos/skin-types/type-6-a.jpg', 'Torso · vitiligo present', 'https://dermnetnz.org/imagedetail/6337-fitzpatrick-skin-type-6'),
    { src: '/photos/skin-types/type-6-b.jpg', caption: 'Cheek · after treatment', source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10889290/#jcm-13-01036-f002', credit: 'Veronese et al., 2024' },
  ], note: 'The lighter vitiligo patches and treatment effects are not defining features of this phototype.' },
};
