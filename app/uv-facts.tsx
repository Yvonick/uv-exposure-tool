'use client';

import { useState, type ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';
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
  { name: 'Grass / soil', low: 10, high: 10, label: '<10%', openLow: true, point: null },
  { name: 'Water', low: 10, high: 30, label: '<10 to 30%', openLow: true, point: null },
  { name: 'Sand', low: 5, high: 25, label: '5–25%', openLow: false, point: 15 },
  { name: 'Sea foam', low: 25, high: 25, label: '~25%¹', openLow: false, point: 25 },
  { name: 'Snow', low: 40, high: 90, label: '40–90%', openLow: false, point: 80 },
];

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className="fact-source" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}
function Evidence({ summary = 'Sources and details', children }: { summary?: string; children: ReactNode }) {
  return <details className="evidence"><summary>{summary}</summary><div className="evidence-content">{children}</div></details>;
}
function Finding({ region, agency, href, children }: { region: string; agency: string; href: string; children: ReactNode }) {
  return <div className="evidence-finding"><div><span>{region}</span><Source href={href}>{agency}</Source></div><p>{children}</p></div>;
}

export default function UvFacts() {
  const [intensity, setIntensity] = useState(3);
  const [minutes, setMinutes] = useState(3);
  const dose = standardErythemalDose(intensity, minutes);
  const referencePercent = Math.round(dose / DAILY_REFERENCE_SED * 100);
  const marker = Math.min(dose, 20) / 20 * 100;

  return (
    <div className="uv-facts">
      <section className="fact-section" aria-labelledby="skin-title" id="skin">
        <div className="fact-heading"><h2 id="skin-title">Skin and UV dose</h2></div>
        <div className="fact-content">
          <div className="dose-controls">
            <div><div className="slider-heading"><label id="intensity-label">UV Index</label><output>{intensity}</output></div><Slider aria-labelledby="intensity-label" value={[intensity]} onValueChange={(value) => setIntensity(Array.isArray(value) ? value[0] : value)} min={1} max={12} step={1} /><div className="slider-endpoints"><span>1</span><span>12</span></div></div>
            <div><div className="slider-heading"><label id="duration-label">Time outside (minutes)</label><output>{minutes} min</output></div><Slider aria-labelledby="duration-label" value={[minutes]} onValueChange={(value) => setMinutes(Array.isArray(value) ? value[0] : value)} min={1} max={180} step={1} /><div className="slider-endpoints"><span>1 min</span><span>3 hours</span></div></div>
          </div>
          <div className="dose-result" aria-live="polite"><div><strong>{dose.toFixed(2)}</strong><span>SED</span></div><p>{referencePercent}% of the 1 SED daily reference{dose > 20 ? ' · exposure marker beyond the graph scale' : ''}</p></div>
          <figure className="skin-dose-chart">
            <figcaption className="dose-chart-legend"><span><i className="med-key" />First visible sunburn range</span><span><i className="reference-key" />Daily reference · 1 SED</span><span><i className="exposure-key" />Selected exposure</span></figcaption>
            <div className="skin-dose-scale" aria-hidden="true"><span>0</span><span>5</span><span>10</span><span>15</span><span>20 SED</span></div>
            {skinDoseRanges.map((skin) => (
              <div className="skin-dose-row" key={skin.type}>
                <span><strong>Type {skin.type}</strong><small>{skin.response}</small></span>
                <div className="skin-dose-track" aria-hidden="true">
                  <div className="skin-dose-range" style={{ left: `${skin.low / 20 * 100}%`, width: `${(skin.high - skin.low) / 20 * 100}%` }} />
                  <i className="skin-daily-reference" style={{ left: `${DAILY_REFERENCE_SED / 20 * 100}%` }} />
                  <i className="skin-dose-marker" style={{ left: `${marker}%` }} />
                </div>
                <strong>{skin.low}–{skin.high}<small> SED</small></strong>
              </div>
            ))}
          </figure>
          <p className="fact-note">1 SED is a fixed dose unit. ARPANSA’s 1 SED daily reference applies across the chart; it is not a damage-free limit or a new allowance for each outing. Sunburn thresholds vary by skin type, but validated “safe daily doses” for each type are not available.</p>
          <Evidence>
            <Finding region="Netherlands · RIVM" agency="Sunburn ranges · table 1" href={sources.rivm}>These characteristic ranges describe first redness assessed about a day later. Colour alone cannot predict an individual threshold.</Finding>
            <Finding region="Australia · ARPANSA" agency="Daily exposure reference" href={sources.arpansa}>Describes 1 SED per day as safe for most people and advises considering protection beyond it, especially with fair skin. This is practical guidance, not a universal biological safety boundary.</Finding>
            <Finding region="UK · human study" agency="2018 study · skin types I–VI" href={sources.dna2018}>DNA damage was detected at 20% of each participant’s individual sunburn dose. Darker skin showed greater protection in deeper layers; the findings do not establish a higher safe daily dose.</Finding>
            <Finding region="Germany · Charité" agency="2025 pilot study" href={sources.dna2025}>Exposure at 25% of individual sunburn dose also produced photodamage in a study including types IV–V. The small groups and variability limit personal predictions.</Finding>
            <Finding region="Malaysia · 167 volunteers" agency="Wong et al., 2018" href={sources.malaysia}>Among types III–V, phototype did not reliably distinguish the measured burn thresholds.</Finding>
            <p className="fact-note">Dose = UVI × minutes × 0.015 SED; 1 SED = 100 erythemally weighted J/m² (<Source href={sources.cie}>CIE</Source>). Assumes constant ambient UV; clothing, shade and orientation affect skin dose. This calculator does not track your whole day. <Source href={sources.protection}>WHO recommends protection from UVI 3.</Source></p>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="sky-title" id="sky">
        <div className="fact-heading"><h2 id="sky-title">Sky and atmosphere</h2></div>
        <div className="fact-content">
          <div className="sky-metrics" aria-label="UV remaining relative to clear sky in Japanese observations">
            <div><span>Thin overcast</span><strong>80–90%</strong></div>
            <div><span>Cloudy</span><strong>~60%</strong></div>
            <div><span>Rain</span><strong>~30%</strong></div>
          </div>
          <p className="fact-note">UV remaining compared with clear sky in Japanese observations. A clear-sky UVI 6 can still be around 5 under thin cloud. Check the live UV Index: cloud cover alone is not a reason to skip protection at UVI 3+.</p>
          <Evidence>
            <Finding region="Japan · JMA" agency="Cloud observations" href={sources.jmaCloud}>The percentages are averages from Japanese stations, not corrections for today. Broken cloud can occasionally increase UV beyond clear-sky levels.</Finding>
            <Finding region="Switzerland · FOPH" agency="Cloud and atmosphere" href={sources.swiss}>Light cloud is reported to reduce UV by only about 5–10%. Cloud categories and conditions differ from the Japanese averages.</Finding>
            <Finding region="USA · EPA" agency="UV guide" href={sources.epa}>Thin clouds let substantial UV through; cloud edges can enhance it. Ozone and airborne particles also affect UV, so there is no single cloud multiplier.</Finding>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="ground-title" id="ground">
        <div className="fact-heading"><h2 id="ground-title">Ground and surroundings</h2></div>
        <div className="fact-content">
          <figure className="reflectance-chart">
            <figcaption className="reflection-legend"><span><i />Published range of UV reflected</span><span><b />Specific reference value</span></figcaption>
            <div className="reflectance-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
            {surfaces.map((surface) => (
              <div className="reflectance-row" key={surface.name}>
                <span>{surface.name}</span>
                <div className="reflectance-track range-track" aria-hidden="true">
                  {surface.high > surface.low && <div className="reflection-range" style={{ left: `${surface.low}%`, width: `${surface.high - surface.low}%` }} />}
                  {surface.openLow && <div className="reflection-open" style={{ width: `${surface.low}%` }}><span>‹</span></div>}
                  <i className="reflection-cap" style={{ left: `${surface.high}%` }} />
                  {!surface.openLow && surface.high > surface.low && <i className="reflection-cap" style={{ left: `${surface.low}%` }} />}
                  {surface.point !== null && <i className="reflection-point" style={{ left: `${surface.point}%` }} />}
                </div>
                <strong>{surface.label}</strong>
              </div>
            ))}
          </figure>
          <p className="fact-note">Only the reported range is coloured. Sand spans 5–25%; the dot marks EPA’s 15% estimate. Left arrows mean a lower bound was not specified. These are reflected fractions, not increases in your personal dose; surface condition and sun angle matter.</p>
          <Evidence>
            <Finding region="Switzerland · FOPH" agency="Reflection ranges" href={sources.swiss}>Sand 5–25%, snow 40–90%, water 10–30%. These ranges include differences in surface conditions.</Finding>
            <Finding region="USA · EPA" agency="UV guide" href={sources.epa}>Sand about 15%, water about 10%, snow up to 80%. Snow’s dot marks the commonly cited 80% reference.</Finding>
            <Finding region="Asia · HKO / Japan" agency="HKO environmental factors" href={sources.hko}>Grass, soil and water below 10%; sand 10–25%; fresh snow around 80%. A “below 10%” estimate has no stated minimum. <Source href={sources.jmaGround}>JMA</Source> also gives fresh snow at 80% and beach sand up to 25%.</Finding>
            <p className="fact-note"><Source href={sources.who}>¹ WHO: sea foam about 25%</Source> is a single-source point. The chart combines published estimates, not statistical confidence intervals. Some agencies share underlying guidance.</p>
          </Evidence>
        </div>
      </section>
    </div>
  );
}
