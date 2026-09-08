'use client';

import { useState, type ReactNode } from 'react';
import { Cloud, CloudSun, Sun } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { DAILY_REFERENCE_SED, skinDoseRanges, standardErythemalDose } from '@/lib/uv-dose';

const sources = {
  who: 'https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-%28uv%29',
  protection: 'https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index',
  whoGuide: 'https://iris.who.int/bitstream/handle/10665/42459/9241590076.pdf?sequence=1',
  rivm: 'https://www.rivm.nl/bibliotheek/rapporten/2023-0426.pdf#page=19',
  arpansa: 'https://www.arpansa.gov.au/services/monitoring/ultraviolet-radiation-monitoring/ultraviolet-radiation-dose/ultraviolet',
  arpansaMed: 'https://www.arpansa.gov.au/sites/default/files/legacy/pubs/rps/rps6.pdf#page=73',
  malaysia: 'https://pubmed.ncbi.nlm.nih.gov/29953669/',
  dna: 'https://pubmed.ncbi.nlm.nih.gov/42370836/',
  aad: 'https://www.aad.org/public/diseases/skin-cancer/darker-skin-tones',
  epa: 'https://www.epa.gov/sites/default/files/documents/uviguide.pdf',
  epaIndex: 'https://www.epa.gov/sunsafety/learn-about-uv-index',
  epaProtection: 'https://www.epa.gov/sunsafety/uv-index-scale-0',
  swiss: 'https://www.meteoswiss.admin.ch/weather/weather-and-climate-from-a-to-z/uv-index.html',
  swissReflection: 'https://www.meteosuisse.admin.ch/meteo/meteo-et-climat-de-a-a-z/index-uv.html',
  hko: 'https://www.hko.gov.hk/en/wxinfo/uvinfo/uvinfo.html',
  jmaCloud: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-73uvindex_mini.html',
  jmaAerosol: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-74uvindex_mini.html',
  jmaGround: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-76uvindex_mini.html',
  jmaAltitude: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-77uvindex_mini.html',
  jmaDefinition: 'https://www.jma.go.jp/jma/kishou/know/env/uvhp/3-51uvindex_define.html',
  cie: 'https://cie.co.at/eilvterm/17-26-069',
};

const surfaces = [
  { name: 'Grass / soil', low: 0, high: 10, label: '<10%', bound: true },
  { name: 'Water', low: 0, high: 10, label: 'usually <10%', bound: true },
  { name: 'Sand', low: 10, high: 25, label: 'about 10–25%', bound: false },
  { name: 'Sea foam', low: 0, high: 25, label: 'about 25%¹', bound: false },
  { name: 'Fresh snow', low: 0, high: 80, label: 'up to 80%', bound: true },
];

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className="fact-source" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

function Evidence({ summary, children }: { summary: string; children: ReactNode }) {
  return <details className="evidence"><summary>{summary}</summary><div className="evidence-content">{children}</div></details>;
}

function Finding({ region, agency, href, children }: { region: string; agency: string; href: string; children: ReactNode }) {
  return <div className="evidence-finding"><div><span>{region}</span><Source href={href}>{agency}</Source></div><p>{children}</p></div>;
}

export default function UvFacts({ latitude, locationName }: { latitude: number; locationName: string }) {
  const [altitude, setAltitude] = useState(1000);
  const [intensity, setIntensity] = useState(3);
  const [minutes, setMinutes] = useState(3);
  const dose = standardErythemalDose(intensity, minutes);
  const referencePercent = Math.round(dose / DAILY_REFERENCE_SED * 100);
  const skinMarker = Math.min(dose, 20) / 20 * 100;
  const latitudeLabel = `${Math.abs(latitude).toFixed(1)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const seasonText = Math.abs(latitude) < 23.44
    ? 'Within the tropics, the sun can be high throughout the year. UV can stay strong outside a single summer season.'
    : latitude >= 0
      ? 'At this northern latitude, a higher summer sun generally produces more UV than the lower winter sun.'
      : 'At this southern latitude, a higher summer sun generally produces more UV than the lower winter sun.';
  const setExample = (uv: number, duration: number) => { setIntensity(uv); setMinutes(duration); };

  return (
    <div className="uv-facts">
      <section className="fact-section" aria-labelledby="skin-title" id="skin">
        <div className="fact-heading">
          <h2 id="skin-title">Skin and UV</h2>
          <p>How much exposure causes visible sunburn? Compare published dose ranges across six skin phototypes.</p>
          <Source href={sources.rivm}>RIVM · Netherlands · reference ranges</Source>
        </div>
        <div className="fact-content">
          <figure className="skin-dose-chart">
            <figcaption>Typical dose at first visible redness <span>Standard erythemal doses (SED)</span></figcaption>
            <div className="skin-dose-scale" aria-hidden="true"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></div>
            {skinDoseRanges.map((skin) => (
              <div className="skin-dose-row" key={skin.type}>
                <span><strong>Type {skin.type}</strong><small>{skin.response}</small></span>
                <div className="skin-dose-track" aria-hidden="true">
                  <div className="skin-dose-range" style={{ left: `${skin.low / 20 * 100}%`, width: `${(skin.high - skin.low) / 20 * 100}%` }} />
                  <i className="skin-dose-marker" style={{ left: `${skinMarker}%` }} />
                </div>
                <strong>{skin.low}–{skin.high}<small> SED</small></strong>
              </div>
            ))}
          </figure>
          <div className="skin-example" aria-live="polite"><i aria-hidden="true" /><span>Example: <strong>UVI {intensity} × {minutes} min = {dose.toFixed(2)} SED</strong>{dose > 20 ? ' · beyond the chart scale' : ''}</span><a href="#duration">Adjust exposure ↓</a></div>
          <div className="dose-presets" role="group" aria-label="Exposure examples">
            <button type="button" aria-pressed={intensity === 3 && minutes === 3} onClick={() => setExample(3, 3)}>3 min at UVI 3</button>
            <button type="button" aria-pressed={intensity === 6 && minutes === 30} onClick={() => setExample(6, 30)}>30 min at UVI 6</button>
          </div>
          <p className="fact-note">A SED is a fixed unit of UV dose. These ranges describe first redness assessed about a day later, not a personal exposure allowance. Phototypes describe burning and tanning response; colour alone cannot predict your threshold.</p>
          <div className="skin-actions">
            <article><h3>Burns easily?</h3><p>Use shade and covering clothing early. Protection is generally recommended from UVI 3; redness can appear long after the exposure.</p><Source href={sources.protection}>WHO · protection guidance</Source></article>
            <article><h3>Dark spots or uneven pigmentation?</h3><p>Visible light can worsen dark spots, particularly in darker skin. AAD recommends tinted, broad-spectrum SPF 30+ sunscreen with iron oxides. Visible light is outside the UV Index.</p><Source href={sources.aad}>AAD · USA · pigmentation guidance</Source></article>
          </div>
          <Evidence summary="Compare the evidence · Netherlands, Australia & Malaysia">
            <Finding region="Europe · Netherlands" agency="RIVM, 2023 · table 1" href={sources.rivm}>Supplies the characteristic dose ranges shown above. They describe visible sunburn, not a threshold for every type of UV damage.</Finding>
            <Finding region="Oceania · Australia" agency="ARPANSA · MED reference values" href={sources.arpansaMed}>Lists simplified values of 2, 2.5, 3, 4.5, 6 and 10 SED for types I–VI. These support the rough scale, rather than validating each range.</Finding>
            <Finding region="Asia · Malaysia" agency="Wong et al., 2018 · 167 volunteers" href={sources.malaysia}>In this study of types III–V, phototype did not reliably distinguish measured burn thresholds. Individual variation limits personal predictions.</Finding>
            <p className="fact-note">The references support a broad comparison. They do not establish globally fixed thresholds for each skin type.</p>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="sky-title" id="sky">
        <div className="fact-heading">
          <h2 id="sky-title">Sky and atmosphere</h2>
          <p>Clouds change the amount and direction of UV reaching the ground. Brightness and temperature are unreliable guides.</p>
          <span className="evidence-region-label">Sources: USA · Switzerland · Japan</span>
        </div>
        <div className="fact-content">
          <div className="sky-grid">
            <article><Sun aria-hidden="true" /><h3>Clear sky</h3><p>Sun height, ozone and aerosols set the clear-sky UV level.</p></article>
            <article><CloudSun aria-hidden="true" /><h3>Thin / broken cloud</h3><p>Most UV can still pass through. Scattering can sometimes increase it.</p></article>
            <article><Cloud aria-hidden="true" /><h3>Thick cloud</h3><p>Usually reduces UV. An overcast sky does not guarantee a low UV Index.</p></article>
          </div>
          <dl className="atmosphere-list">
            <div><dt>Ozone</dt><dd>Absorbs much of the UVB. Less overhead ozone generally means more UV at the surface.</dd></div>
            <div><dt>Aerosols</dt><dd>Dust, smoke and haze absorb and scatter UV. Their effect depends on the particles and their concentration.</dd></div>
          </dl>
          <p className="fact-note">The regional guidance agrees: check the UV Index even when it is cloudy. There is no universal cloud multiplier; the annual chart uses a clear-sky baseline.</p>
          <Evidence summary="Compare regional sources · cloud, ozone & haze">
            <Finding region="North America · USA" agency="EPA · UV guide" href={sources.epa}>Thin and broken clouds can transmit substantial UV; cloud edges can enhance it. Ozone and other atmospheric conditions affect surface UV.</Finding>
            <Finding region="Europe · Switzerland" agency="MeteoSwiss · UV index" href={sources.swiss}>Thin cloud may leave UV high. Sun height, ozone and cloud conditions all influence the index.</Finding>
            <Finding region="Asia · Japan" agency="JMA · cloud observations" href={sources.jmaCloud}>Japanese observations average about 80–90% of clear-sky UV under thin overcast, 60% under cloudy skies and 30% in rain. These are local averages with substantial variation.</Finding>
            <Finding region="Asia · Japan" agency="JMA · aerosols" href={sources.jmaAerosol}>Airborne particles absorb and scatter UV. Cleaner air can allow more UV through.</Finding>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="ground-title" id="ground">
        <div className="fact-heading">
          <h2 id="ground-title">Ground and surroundings</h2>
          <p>Reflected UV reaches you from below and from the sides, adding to direct and scattered sunlight.</p>
          <span className="evidence-region-label">Sources: USA · Switzerland · Japan / Hong Kong</span>
        </div>
        <div className="fact-content">
          <figure className="reflectance-chart">
            <figcaption>Share of incoming UV reflected</figcaption>
            <div className="reflectance-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
            {surfaces.map((surface) => (
              <div className="reflectance-row" key={surface.name}>
                <span>{surface.name}</span>
                <div className="reflectance-track" aria-hidden="true"><div className={surface.bound ? 'reflectance-fill bounded' : 'reflectance-fill'} style={{ marginLeft: `${surface.low}%`, width: `${surface.high - surface.low}%` }} /></div>
                <strong>{surface.label}</strong>
              </div>
            ))}
          </figure>
          <p className="fact-note">Approximate reflected fractions, not percentage increases in your exposure. Stripes show bounds; sand shows a range. Water reflection varies with sun angle. A hat or parasol does not block every direction of reflected UV.</p>
          <Source href={sources.who}>¹ Sea foam: WHO estimate</Source>
          <Evidence summary="Compare regional sources · where the numbers agree">
            <Finding region="North America · USA" agency="EPA · UV guide" href={sources.epa}>Lists sand at about 15%, water at about 10%, and snow up to 80%.</Finding>
            <Finding region="Europe · Switzerland" agency="MétéoSuisse · reflection (French)" href={sources.swissReflection}>Snow-covered surfaces can reflect up to 80% of UV.</Finding>
            <Finding region="Asia · Japan" agency="JMA · ground reflection" href={sources.jmaGround}>Lists beach sand at 25%, grass / asphalt at 10% or less, and fresh snow at 80%.</Finding>
            <Finding region="Asia · Hong Kong" agency="HKO · environmental factors" href={sources.hko}>Gives sand as 10–25%, and grass, soil and water below 10%. The chart uses that range rather than implying a universal sand value.</Finding>
            <p className="fact-note">The agencies agree on the broad ranking. Surface condition and sun angle explain some variation. The sea-foam estimate is from WHO alone.</p>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="geography-title" id="geography">
        <div className="fact-heading">
          <h2 id="geography-title">Latitude, seasons and altitude</h2>
          <p>A higher sun sends UV through less atmosphere. At higher elevations, there is also less atmosphere above you.</p>
          <span className="evidence-region-label">Sources: USA · Switzerland · Japan</span>
        </div>
        <div className="fact-content">
          <div className="geography-content">
            <div className="location-context"><span>{locationName} · {latitudeLabel}</span><p>{seasonText}</p><p className="fact-note">Clock changes shift the yearly band because the chart uses local civil time. They do not change the sun.</p></div>
            <div className="altitude-example">
              <div className="slider-heading"><label id="altitude-label">Elevation above sea level (m)</label><output>{altitude.toLocaleString('en')} m</output></div>
              <Slider aria-labelledby="altitude-label" value={[altitude]} onValueChange={(value) => setAltitude(Array.isArray(value) ? value[0] : value)} min={0} max={3000} step={250} />
              <div className="slider-endpoints" aria-hidden="true"><span>Sea level</span><span>3,000 m</span></div>
              <div className="altitude-result" aria-live="polite"><strong>+{(altitude / 100).toFixed(altitude % 100 === 0 ? 0 : 1)}%</strong><span>illustrative UV increase</span></div>
              <p className="fact-note">Illustration: 10% per 1,000 m. Published rules of thumb vary from about 6–12%; actual conditions can fall outside that range. The annual chart retains its sea-level baseline.</p>
            </div>
          </div>
          <Evidence summary="Compare regional sources · altitude rules of thumb">
            <Finding region="North America · USA" agency="EPA · UV index calculation" href={sources.epaIndex}>Uses an approximate 6% increase per 1,000 metres of elevation.</Finding>
            <Finding region="Europe · Switzerland" agency="MeteoSwiss · altitude" href={sources.swiss}>Gives approximately 10–12% more UV per 1,000 metres.</Finding>
            <Finding region="Asia · Japan" agency="JMA · altitude observations" href={sources.jmaAltitude}>Uses about 10% as a general guide, but measured roughly 40% more summer UV at a 2,772 m mountain site than at a 31 m site. Cleaner mountain air can add to the height effect.</Finding>
            <p className="fact-note">These sources also agree that sun height drives the daily and seasonal cycle. Their percentages are approximations, not upper and lower physical limits.</p>
          </Evidence>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="duration-title" id="duration">
        <div className="fact-heading">
          <h2 id="duration-title">Intensity × time</h2>
          <p>A short outing adds less UV than a long one. Compare the dose with a documented daily reference.</p>
          <Source href={sources.arpansa}>ARPANSA · Australia · dose guidance</Source>
        </div>
        <div className="fact-content">
          <div className="dose-controls">
            <div><div className="slider-heading"><label id="intensity-label">UV Index</label><output>{intensity}</output></div><Slider aria-labelledby="intensity-label" value={[intensity]} onValueChange={(value) => setIntensity(Array.isArray(value) ? value[0] : value)} min={1} max={12} step={1} /><div className="slider-endpoints" aria-hidden="true"><span>1</span><span>12</span></div></div>
            <div><div className="slider-heading"><label id="duration-label">Time outside (minutes)</label><output>{minutes} min</output></div><Slider aria-labelledby="duration-label" value={[minutes]} onValueChange={(value) => setMinutes(Array.isArray(value) ? value[0] : value)} min={1} max={180} step={1} /><div className="slider-endpoints" aria-hidden="true"><span>1 min</span><span>3 hours</span></div></div>
          </div>
          <div className="dose-result" aria-live="polite">
            <div><strong>{dose.toFixed(2)}</strong><span>SED · estimated ambient dose</span></div>
            <p><strong>{referencePercent}%</strong> of the 1 SED daily reference</p>
          </div>
          <div className="dose-reference-chart" role="img" aria-label={`${dose.toFixed(2)} SED compared with a 1 SED daily reference; the chart runs from zero to two SED`}>
            <div className="dose-reference-track" aria-hidden="true"><div style={{ width: `${Math.min(dose / 2, 1) * 100}%` }} /><i /></div>
            <div className="dose-reference-scale"><span>0</span><strong>1 SED · daily reference</strong><span>2 SED{dose > 2 ? ' →' : ''}</span></div>
            {dose > 2 && <p className="fact-note">This example exceeds the chart’s 2 SED scale; the full dose is shown above.</p>}
          </div>
          <div className="daily-reference-copy">
            <h3>A reference, with limits</h3>
            <p>ARPANSA describes 1 SED per day as safe for most people and advises considering protection above it, especially for fair skin. It is a daily reference, not a fresh allowance for each outing or a guarantee against skin damage.</p>
            <p>Protection is generally recommended from UVI 3. Shade, covering clothes, sunglasses and sunscreen work together.</p>
          </div>
          <div className="dose-comparison" aria-label="Equal ambient dose from a longer exposure and a shorter exposure at twice the UV Index">
            <div className="dose-example"><span>UVI {intensity} · {minutes} min</span><div className="dose-block-space"><div className="dose-block" style={{ width: '100%', height: 36 }} /></div></div>
            <div className="dose-example"><span>UVI {intensity * 2} · {minutes / 2} min</span><div className="dose-block-space"><div className="dose-block" style={{ width: '50%', height: 72 }} /></div></div>
          </div>
          <p className="fact-note">Equal areas, equal dose. Calculated as UVI × minutes × 0.015 SED, assuming constant UV. Shade, clothing and body orientation change the dose reaching your skin. This example does not measure your accumulated daily exposure.</p>
          <Evidence summary="Is there a safe threshold? What the sources actually say">
            <Finding region="Oceania · Australia" agency="ARPANSA · daily guidance" href={sources.arpansa}>Provides the 1 SED daily reference used here. It is practical public guidance, not a universally agreed biological safety threshold.</Finding>
            <Finding region="International" agency="WHO · practical guide" href={sources.whoGuide}>Discourages time-to-burn displays because they can imply that shorter exposures are safe.</Finding>
            <Finding region="Research · Australia" agency="O’Hara et al., 2026 · 58 participants" href={sources.dna}>A study of types I–III using 0.7 and 1.6 SED exposures on four consecutive days found measurable DNA damage. It did not establish cancer risk from a single short outing.</Finding>
            <div className="evidence-finding"><div><span>Broad agreement</span><strong>Protection from UVI 3</strong></div><p>This is the shared practical advice from <Source href={sources.epaProtection}>EPA · USA</Source>, <Source href={sources.protection}>WHO</Source> and <Source href={sources.hko}>HKO · Hong Kong</Source>. They do not all endorse the 1 SED reference.</p></div>
            <p className="fact-note">Dose units: <Source href={sources.cie}>CIE · 1 SED = 100 J/m²</Source>; <Source href={sources.jmaDefinition}>JMA · UVI = 40 × erythemal W/m²</Source>. For 3 minutes at UVI 3, the calculation gives 0.135 SED—13.5% of the daily reference (14% when rounded).</p>
          </Evidence>
        </div>
      </section>
    </div>
  );
}
