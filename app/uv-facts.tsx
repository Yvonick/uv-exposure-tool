'use client';

import { type ReactNode } from 'react';
import { useExploration } from './exploration';
import { Slider } from '@/components/ui/slider';
import SkinPhotoCard from './skin-photo-card';
import { phototypeSource } from '@/lib/skin-photos';
import { useLanguage } from './language';
import { DAILY_REFERENCE_SED, skinDoseRanges, standardErythemalDose } from '@/lib/uv-dose';

const sources = {
  who: 'https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-%28uv%29',
  rivm: 'https://www.rivm.nl/bibliotheek/rapporten/2023-0426.pdf#page=19',
  arpansa: 'https://www.arpansa.gov.au/services/monitoring/ultraviolet-radiation-monitoring/ultraviolet-radiation-dose/ultraviolet',
  malaysia: 'https://pubmed.ncbi.nlm.nih.gov/29953669/',
  dna2018: 'https://doi.org/10.1016/j.jid.2018.04.015',
  epa: 'https://www.epa.gov/sites/default/files/documents/uviguide.pdf',
  swiss: 'https://www.bag.admin.ch/fr/rayonnement-solaire',
  hko: 'https://www.hko.gov.hk/en/wxinfo/uvinfo/uvinfo.html',
  jmaCloud: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-73uvindex_mini.html',
  jmaGround: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-76uvindex_mini.html',
  cie: 'https://cie.co.at/eilvterm/17-26-069',
};

const surfaces = [
  { name: 'Grass / soil', low: 0, high: 10, label: '<10%*' },
  { name: 'Water', low: 0, high: 30, label: 'upTo' },
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
  const { t } = useLanguage();
  return <div className="evidence-finding"><div><Source href={href}>{t(agency)}</Source></div><p>{children}</p></div>;
}

export default function UvFacts() {
  const { t, number } = useLanguage();
  const { exploration, setExploration } = useExploration();
  const { intensity, minutes } = exploration.dose;
  const setIntensity = (intensity: number) => setExploration(previous => ({ ...previous, dose: { ...previous.dose, intensity } }));
  const setMinutes = (minutes: number) => setExploration(previous => ({ ...previous, dose: { ...previous.dose, minutes } }));
  const dose = standardErythemalDose(intensity, minutes);
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
          <div className="dose-result" aria-live="polite"><div><strong>{number(dose, 2)}</strong><span>{t("SED")}</span></div><p>{t('SED is a standard unit of accumulated UV dose.')}{dose > 20 ? ` · ${t('exposure marker beyond the graph scale')}` : ''}</p></div>
          <figure className="skin-dose-chart">
            <figcaption className="dose-chart-legend"><span><i className="med-key" />{t("Typical dose for first visible redness")}</span><span><i className="reference-key" />{t("ARPANSA reference · 1 SED")}</span><span><i className="exposure-key" />{t("Selected exposure")}</span></figcaption>
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
          <p className="fact-note">{t('Individual responses vary. The ARPANSA reference is not a damage-free limit.')}</p>
          <Evidence>
            <p className="fact-note">{t('SED means standard erythemal dose: UV energy weighted for its ability to cause sunburn.')}</p>
            <Finding agency="DermNet · Fitzpatrick" href={phototypeSource}>{t("DermNet describes the Fitzpatrick phototypes by their tendency to sunburn and tan.")}</Finding>
            <Finding agency="RIVM, 2023 · background report" href={sources.rivm}>{t("Characteristic first-redness ranges, assessed about a day later (table 1); not individual predictions.")}</Finding>
            <Finding agency="ARPANSA · public guidance" href={sources.arpansa}>{t("ARPANSA uses 1 SED as a practical daily reference for most people. It refers to cumulative exposure over the day, not a fresh allowance for each outing. Validated safe daily doses for individual skin types are not available.")}</Finding>
            <Finding agency="Shih et al., 2018" href={sources.dna2018}>{t("DNA damage occurred at 20% of individual sunburn dose. A visible burn is not the first sign of biological damage.")}</Finding>
            <Finding agency="Wong et al., 2018 · 167 participants" href={sources.malaysia}>{t("Among 167 volunteers with types III–V, phototype did not reliably distinguish the measured burn thresholds.")}</Finding>
            <p className="fact-note">{t("Dose = UVI × minutes × 0.015 SED; 1 SED = 100 erythemally weighted J/m² (")}<Source href={sources.cie}>{t("CIE")}</Source>{t("). Assumes constant ambient UV; clothing, shade and orientation affect skin dose. This calculator does not track your whole day.")}</p>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="sky-title" id="sky">
        <div className="fact-heading"><h2 id="sky-title">{t("Sky and atmosphere")}</h2></div>
        <div className="fact-content">
          <div className="sky-metrics" aria-label={t("Percentage of clear-sky UV that reaches the ground")}>
            <div><span>{t("Thin overcast")}</span><strong>{t('{value}%', { value: '80–90' })}</strong></div>
            <div><span>{t("Overcast")}</span><strong>≈{t('{value}%', { value: number(60) })}</strong></div>
            <div><span>{t("Rain")}</span><strong>≈{t('{value}%', { value: number(30) })}</strong></div>
          </div>
          <p className="fact-note"><strong>{t("The UV Index is linear.")}</strong> {t('+10% UV means UVI 3 → 3.3, or UVI 6 → 6.6. Each UVI unit represents the same increase in sunburn-weighted radiation.')} <Source href="https://www.cpc.ncep.noaa.gov/products/stratosphere/uv_index/uv_compute.shtml">{t("NOAA")}</Source></p>
          <Evidence>
            <Finding agency="JMA · station observations, 1997–2010" href={sources.jmaCloud}>{t("These percentages compare observed UV with estimated clear-sky UV. They are averages for cloud categories at four Japanese stations, not universal multipliers for today’s forecast.")}</Finding>
            <Finding agency="FOPH" href={sources.swiss}>{t("Light cloud reduces UV by only about 5–10%; its categories and conditions differ from JMA’s.")}</Finding>
            <Finding agency="EPA" href={sources.epa}>{t("Cloud edges can raise UV above clear-sky levels. Ozone and airborne particles also matter; no single cloud multiplier applies.")}</Finding>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="ground-title" id="ground">
        <div className="fact-heading"><h2 id="ground-title">{t("Surfaces and reflected UV")}</h2></div>
        <div className="fact-content">
          <figure className="reflectance-chart">
            <figcaption className="reflection-legend"><span><i />{t("Incoming UV reflected by the surface")}</span><span><i className="hatched-key" />{t("Range across published estimates")}</span></figcaption>
            <div className="reflectance-scale" aria-hidden="true">{[0,50,100].map(value => <span key={value}>{t('{value}%', { value: number(value) })}</span>)}</div>
            {surfaces.map((surface) => (
              <div className="reflectance-row" key={surface.name}>
                <span>{t(surface.name)}</span>
                <div className="reflectance-track" aria-hidden="true">
                  <div className="reflectance-fill" style={{ width: `${surface.high}%` }} />
                  {surface.high > surface.low && <div className="reflection-uncertainty" style={{ left: `${surface.low}%`, width: `${surface.high - surface.low}%` }} />}
                </div>
                <strong>{surface.label === 'upTo' ? t('Up to {value}%*', { value: number(surface.high) }) : t('{value}%', { value: surface.label.replace('%*', '').replace('%', '').replace('~', '≈') }) + (surface.label.endsWith('*') ? '*' : '')}</strong>
              </div>
            ))}
          </figure>
          <p className="fact-note">{t("Bars run from zero to the highest estimate; hatching shows the variable part.")} {t('These percentages describe reflection by the surface, not a direct increase in UV Index.')}</p>
          <Evidence>
            <p className="fact-note">{t("*For “below 10%”, no minimum is given, so hatching starts at zero. Sea foam has one approximate reference value.")}</p>
            <Finding agency="JMA" href={sources.jmaGround}>{t("Extensive snowfields can increase UVI by 40–50%: UVI 3 becomes about 4.2–4.5. Surface reflectance is not itself an increase in UVI; this example is not applied to the live forecast.")}</Finding>
            <Finding agency="FOPH" href={sources.swiss}>{t("Sand 5–25%, snow 40–90%, water 10–30%. These ranges include differences in surface conditions.")}</Finding>
            <Finding agency="EPA" href={sources.epa}>{t("Sand about 15%, water about 10%, snow up to 80%.")}</Finding>
            <Finding agency="Hong Kong Observatory" href={sources.hko}>{t("Grass, soil and water below 10%; sand 10–25%; fresh snow around 80%.")}</Finding>
            <Finding agency="WHO" href={sources.who}>{t("Sea foam reflects about 25% of UV.")}</Finding>
            <p className="fact-note">{t("Hatching spans published estimates, not confidence intervals; sources may share underlying guidance. Sun angle, surface condition and body orientation affect exposure.")}</p>
          </Evidence>
        </div>
      </section>
    </div>
  );
}
