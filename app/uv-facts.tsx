'use client';

import { useState, type ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';
import SkinPhotoCard from './skin-photo-card';
import { phototypeSource } from '@/lib/skin-photos';
import { useLanguage } from './language';
import { DAILY_REFERENCE_SED, skinDoseRanges, standardErythemalDose } from '@/lib/uv-dose';

const sources = {
  who: 'https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-%28uv%29',
  protection: 'https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index',
  rivm: 'https://www.rivm.nl/bibliotheek/rapporten/2023-0426.pdf#page=19',
  arpansa: 'https://www.arpansa.gov.au/services/monitoring/ultraviolet-radiation-monitoring/ultraviolet-radiation-dose/ultraviolet',
  malaysia: 'https://pubmed.ncbi.nlm.nih.gov/29953669/',
  dna2018: 'https://doi.org/10.1016/j.jid.2018.04.015',
  dna2025: 'https://pubmed.ncbi.nlm.nih.gov/40617063/',
  epa: 'https://www.epa.gov/sites/default/files/documents/uviguide.pdf',
  swiss: 'https://www.bag.admin.ch/fr/rayonnement-solaire',
  hko: 'https://www.hko.gov.hk/en/wxinfo/uvinfo/uvinfo.html',
  jmaCloud: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-73uvindex_mini.html',
  jmaGround: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-76uvindex_mini.html',
  cie: 'https://cie.co.at/eilvterm/17-26-069',
};

const surfaces = [
  { name: 'Grass / soil', low: 0, high: 10, label: '<10%*' },
  { name: 'Water', low: 0, high: 30, label: '<10–30%*' },
  { name: 'Sand', low: 5, high: 25, label: '5–25%' },
  { name: 'Sea foam', low: 25, high: 25, label: '~25%' },
  { name: 'Snow', low: 40, high: 90, label: '40–90%' },
];

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className="fact-source" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}
function Evidence({ summary = 'Sources and details', children }: { summary?: string; children: ReactNode }) {
  const { t } = useLanguage();
  return <details className="evidence"><summary>{t(summary)}</summary><div className="evidence-content">{children}</div></details>;
}
function Finding({ agency, href, children }: { agency: string; href: string; children: ReactNode }) {
  return <div className="evidence-finding"><div><Source href={href}>{agency}</Source></div><p>{children}</p></div>;
}

export default function UvFacts() {
  const { t, number } = useLanguage();
  const [intensity, setIntensity] = useState(3);
  const [minutes, setMinutes] = useState(15);
  const dose = standardErythemalDose(intensity, minutes);
  const referencePercent = Math.round(dose / DAILY_REFERENCE_SED * 100);
  const marker = Math.min(dose, 20) / 20 * 100;

  return (
    <div className="uv-facts">
      <section className="fact-section" aria-labelledby="skin-title" id="skin">
        <div className="fact-heading"><h2 id="skin-title">{t("Skin and UV dose")}</h2></div>
        <div className="fact-content">
          <div className="dose-controls">
            <div><div className="slider-heading"><label id="intensity-label">{t("UV Index")}</label><output>{intensity}</output></div><Slider aria-labelledby="intensity-label" value={[intensity]} onValueChange={(value) => setIntensity(Array.isArray(value) ? value[0] : value)} min={1} max={12} step={1} /><div className="slider-endpoints"><span>1</span><span>12</span></div></div>
            <div><div className="slider-heading"><label id="duration-label">{t("Time outside (minutes)")}</label><output>{minutes} {t("min")}</output></div><Slider aria-labelledby="duration-label" value={[minutes]} onValueChange={(value) => setMinutes(Array.isArray(value) ? value[0] : value)} min={1} max={180} step={1} /><div className="slider-endpoints"><span>{t("1 min")}</span><span>{t("3 hours")}</span></div></div>
          </div>
          <div className="dose-result" aria-live="polite"><div><strong>{number(dose, 2)}</strong><span>{t("SED")}</span></div><p>{t('{percent}% of the 1 SED daily reference', { percent: number(referencePercent) })}{dose > 20 ? ` · ${t('exposure marker beyond the graph scale')}` : ''}</p></div>
          <figure className="skin-dose-chart">
            <figcaption className="dose-chart-legend"><span><i className="med-key" />{t("First visible sunburn range")}</span><span><i className="reference-key" />{t("Daily reference · 1 SED")}</span><span><i className="exposure-key" />{t("Selected exposure")}</span></figcaption>
            <div className="skin-dose-scale" aria-hidden="true"><span>0</span><span>5</span><span>10</span><span>15</span><span>{t("20 SED")}</span></div>
            {skinDoseRanges.map((skin) => (
              <div className="skin-dose-row" key={skin.type}>
                <SkinPhotoCard type={skin.type} response={skin.response} />
                <div className="skin-dose-track" aria-hidden="true">
                  <div className="skin-dose-range" style={{ left: `${skin.low / 20 * 100}%`, width: `${(skin.high - skin.low) / 20 * 100}%` }} />
                  <i className="skin-daily-reference" style={{ left: `${DAILY_REFERENCE_SED / 20 * 100}%` }} />
                  <i className="skin-dose-marker" style={{ left: `${marker}%` }} />
                </div>
                <strong>{number(skin.low, skin.low % 1 ? 1 : 0)}–{number(skin.high, skin.high % 1 ? 1 : 0)}<small> {t("SED")}</small></strong>
              </div>
            ))}
          </figure>
          <p className="fact-note">{t("1 SED is a fixed dose unit. ARPANSA’s 1 SED daily reference applies across the chart; it is not a damage-free limit or a new allowance for each outing. Sunburn thresholds vary by skin type, but validated “safe daily doses” for each type are not available.")}</p>
          <Evidence>
            <Finding agency="DermNet · Fitzpatrick" href={phototypeSource}>{t("Phototype describes the skin’s response to sunlight, especially burning and tanning. The two portraits for each type are fictional AI-generated illustrations of broad skin-tone descriptions, with consistent framing and lighting. They are not clinical examples, a calibrated colour scale or the participants behind the chart’s SED ranges. DermNet supports the descriptions, not the generated faces.")}</Finding>
            <Finding agency="RIVM" href={sources.rivm}>{t("These characteristic ranges (table 1) describe first redness assessed about a day later. Colour alone cannot predict an individual threshold.")}</Finding>
            <Finding agency="ARPANSA" href={sources.arpansa}>{t("Describes 1 SED per day as safe for most people and advises considering protection beyond it, especially with fair skin. This is practical guidance, not a universal biological safety boundary.")}</Finding>
            <Finding agency="Shih et al., 2018" href={sources.dna2018}>{t("DNA damage was detected at 20% of each participant’s individual sunburn dose. Darker skin showed greater protection in deeper layers; the findings do not establish a higher safe daily dose.")}</Finding>
            <Finding agency="Charité, 2025" href={sources.dna2025}>{t("Exposure at 25% of individual sunburn dose also produced photodamage in a pilot study including types IV–V. The small groups and variability limit personal predictions.")}</Finding>
            <Finding agency="Wong et al., 2018" href={sources.malaysia}>{t("Among 167 volunteers with types III–V, phototype did not reliably distinguish the measured burn thresholds.")}</Finding>
            <p className="fact-note">{t("Dose = UVI × minutes × 0.015 SED; 1 SED = 100 erythemally weighted J/m² (")}<Source href={sources.cie}>{t("CIE")}</Source>{t("). Assumes constant ambient UV; clothing, shade and orientation affect skin dose. This calculator does not track your whole day.")} <Source href={sources.protection}>{t("WHO recommends protection from UVI 3.")}</Source></p>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="sky-title" id="sky">
        <div className="fact-heading"><h2 id="sky-title">{t("Sky and atmosphere")}</h2></div>
        <div className="fact-content">
          <div className="sky-metrics" aria-label={t("Percentage of clear-sky UV that reaches the ground")}>
            <div><span>{t("Thin overcast")}</span><strong>80–90%</strong></div>
            <div><span>{t("Cloudy")}</span><strong>~60%</strong></div>
            <div><span>{t("Rain")}</span><strong>~30%</strong></div>
          </div>
          <p className="fact-note"><strong>{t("The UV Index is linear.")}</strong> {t('+10% UV means UVI 3 → 3.3, or UVI 6 → 6.6. Each UVI unit represents the same increase in sunburn-weighted radiation.')} <Source href="https://www.cpc.ncep.noaa.gov/products/stratosphere/uv_index/uv_compute.shtml">{t("NOAA")}</Source></p>
          <Evidence>
            <Finding agency="JMA" href={sources.jmaCloud}>{t("The percentages are averages from Japanese stations, not corrections for today. Broken cloud can occasionally increase UV beyond clear-sky levels.")}</Finding>
            <Finding agency="FOPH" href={sources.swiss}>{t("Light cloud is reported to reduce UV by only about 5–10%. Cloud categories and conditions differ from the JMA averages.")}</Finding>
            <Finding agency="EPA" href={sources.epa}>{t("Thin clouds let substantial UV through; cloud edges can enhance it. Ozone and airborne particles also affect UV, so there is no single cloud multiplier.")}</Finding>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="ground-title" id="ground">
        <div className="fact-heading"><h2 id="ground-title">{t("Ground and surroundings")}</h2></div>
        <div className="fact-content">
          <figure className="reflectance-chart">
            <figcaption className="reflection-legend"><span><i />{t("UV reflected")}</span><span><i className="hatched-key" />{t("Range across published estimates")}</span></figcaption>
            <div className="reflectance-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
            {surfaces.map((surface) => (
              <div className="reflectance-row" key={surface.name}>
                <span>{t(surface.name)}</span>
                <div className="reflectance-track" aria-hidden="true">
                  <div className="reflectance-fill" style={{ width: `${surface.high}%` }} />
                  {surface.high > surface.low && <div className="reflection-uncertainty" style={{ left: `${surface.low}%`, width: `${surface.high - surface.low}%` }} />}
                </div>
                <strong>{surface.label}</strong>
              </div>
            ))}
          </figure>
          <p className="fact-note">{t("Bars run from zero to the highest estimate; hatching shows the variable part.")}</p>
          <Evidence>
            <p className="fact-note">{t("*For “below 10%”, no minimum is given, so hatching starts at zero. Sea foam has one approximate reference value.")}</p>
            <Finding agency="JMA" href={sources.jmaGround}>{t("Extensive snowfields can increase UVI by 40–50%: UVI 3 becomes about 4.2–4.5. Surface reflectance is not itself an increase in UVI; this example is not applied to the live forecast.")}</Finding>
            <Finding agency="FOPH" href={sources.swiss}>{t("Sand 5–25%, snow 40–90%, water 10–30%. These ranges include differences in surface conditions.")}</Finding>
            <Finding agency="EPA" href={sources.epa}>{t("Sand about 15%, water about 10%, snow up to 80%.")}</Finding>
            <Finding agency="Hong Kong Observatory" href={sources.hko}>{t("Grass, soil and water below 10%; sand 10–25%; fresh snow around 80%. A “below 10%” estimate has no stated minimum.")} <Source href={sources.jmaGround}>{t("JMA")}</Source> {t("also gives fresh snow at 80% and beach sand up to 25%.")}</Finding>
            <Finding agency="WHO" href={sources.who}>{t("Sea foam reflects about 25% of UV; fresh snow can almost double personal exposure.")}</Finding>
            <p className="fact-note">{t("The chart combines published estimates, not statistical confidence intervals. Some agencies share underlying guidance. Sun angle, surface condition and body orientation affect personal exposure.")}</p>
          </Evidence>
        </div>
      </section>
    </div>
  );
}
