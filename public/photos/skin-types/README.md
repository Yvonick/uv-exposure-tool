# Healthy-skin examples and attribution

These six examples replace the celebrity portraits. The studies supply the
Fitzpatrick labels; this application does not classify people from appearance.
The images are illustrative and are not measurements of the chart's SED ranges.
They cover neither the full visual diversity of a type nor comparable lighting
and body sites across the two studies.

## University of Minho — types II, III, V, VI

Gomes, Andreia E.; Linhares, João M. M.; Nascimento, Sérgio M. C. (2024).
**University of Minho Hyperspectral Faces Database: UMINHO-HSFD.** figshare.
[Collection DOI](https://doi.org/10.6084/m9.figshare.c.7163569).
[Paper](https://doi.org/10.1177/00037028241279323).

License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

The collection contains volunteers without diagnosed or visible skin problems.
Its RGB reference images are rendered from hyperspectral measurements under
CIE D65, not ordinary camera photographs. The authors redacted the eye regions
for identity protection. Original JPEG bytes are retained without recolouring,
retouching, resampling, or generated detail. The interface shows cheek regions
through SVG viewBoxes; this display crop excludes the eye redactions, hair and
documented movement artefacts around the eyes. Display cropping is the only
adaptation, and image coordinates below are in source pixels (x, y, width, height).

Phototypes: [faces_metadata](https://figshare.com/articles/dataset/faces_metadata/25599153).
Images: [RGB_files](https://figshare.com/articles/dataset/RGB_files/25594026).
Acquisition defects checked against [images_artifacts, version 2](https://figshare.com/articles/dataset/images_artifacts/25599159/2).

| Type | Local file | Original source file | Dimensions | Display viewBox |
| --- | --- | --- | --- | --- |
| II | minho-207.jpg | [207_RGB_pixelized.jpg](https://ndownloader.figshare.com/files/45622407) | 618 × 923 | 65 485 150 100 |
| III | minho-208.jpg | [208_RGB_pixelized.jpg](https://ndownloader.figshare.com/files/45622437) | 727 × 1037 | 65 545 180 120 |
| V | minho-249.jpg | [249_RGB_pixelized.jpg](https://ndownloader.figshare.com/files/45622386) | 710 × 960 | 65 565 150 100 |
| VI | minho-282.jpg | [282_RGB_pixelized.jpg](https://ndownloader.figshare.com/files/45622383) | 566 × 748 | 65 425 135 90 |

The published metadata contain no type I or IV and just one type VI participant.
In particular, the VI example must not be presented as a representative colour
standard for everyone classified VI.

## Mantri & Jokerst — types I, IV

Yash Mantri and Jesse V. Jokerst (2022). **Impact of skin tone on photoacoustic
oximetry and tools to minimize bias.** Biomedical Optics Express 13(2), 875–887.
[DOI 10.1364/BOE.450224](https://doi.org/10.1364/BOE.450224).
[Figure 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884230/#g002).
**© 2022 Optica Publishing Group.**

License: [Optica Open Access, Version of Record](https://doi.org/10.1364/OA_License_v2#VOR-OA).
This permits noncommercial reuse and adaptations with attribution. It is **not a
Creative Commons license**. These assets are included for this noncommercial
educational site; commercial reuse requires separate rights review or replacement.

Figure 2 identifies panels A and B as dorsal forearms of healthy volunteers with
Fitzpatrick types 1 and 4. Methods §4.1 uses a researcher's subjective assessment
and objective ITA/colorimetry, not a burn-and-tan questionnaire. This limitation
is disclosed in the site's sources panel.

Original JPEG image objects were extracted byte-for-byte with pypdf from page 3
(printed page 877) of the [published PDF](https://europepmc.org/articles/PMC8884230?pdf=render).
These standalone photographs retain the measurement ruler. The blue vector
overlay in the composite figure is separate from the embedded photographs;
it was not digitally removed. No retouching or invented resolution is used.

| Type | Local file | Figure / PDF image object | Dimensions | Display viewBox |
| --- | --- | --- | --- | --- |
| I | mantri-type-I.jpg | 2A / Im1 | 160 × 162 | 0 0 160 162 |
| IV | mantri-type-IV.jpg | 2B / Im0 | 161 × 162 | 0 0 161 162 |

Both are displayed at 160 CSS pixels wide, respecting their modest source resolution.

Source images, labels, licenses, and display crops reviewed on 13 September 2026.
