'use client';

import { useState } from 'react';
import { Cloud, CloudSun, Sun } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const environmentalSource = 'https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-%28uv%29';
const protectionSource = 'https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-%28uv%29-index';
const phototypes = [
  { type: 'I', colour: '#f2d8c4', response: 'Burns very readily', tanning: 'Little or no tanning' },
  { type: 'II', colour: '#e7bc9e', response: 'Burns readily', tanning: 'Limited tanning' },
  { type: 'III', colour: '#d4a27c', response: 'Can burn', tanning: 'Tans gradually' },
  { type: 'IV', colour: '#b67c54', response: 'Burns less readily', tanning: 'Tans readily' },
  { type: 'V', colour: '#885634', response: 'Burning is uncommon', tanning: 'Substantial pigmentation' },
  { type: 'VI', colour: '#523725', response: 'Lowest burn susceptibility', tanning: 'Deep pigmentation' },
];
const surfaces = [
  { name: 'Grass / soil', value: 10, label: '<10%', bound: true },
  { name: 'Water', value: 10, label: 'usually <10%', bound: true },
  { name: 'Dry sand', value: 15, label: 'about 15%', bound: false },
  { name: 'Sea foam', value: 25, label: 'about 25%', bound: false },
  { name: 'Fresh snow', value: 80, label: 'up to 80%', bound: true },
];

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="fact-source" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

export default function UvFacts({ latitude, locationName }: { latitude: number; locationName: string }) {
  const [altitude, setAltitude] = useState(1000);
  const [intensity, setIntensity] = useState(3);
  const [minutes, setMinutes] = useState(60);
  const dose = intensity * minutes / 60;
  const latitudeLabel = `${Math.abs(latitude).toFixed(1)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const seasonText = Math.abs(latitude) < 23.44
    ? 'Within the tropics, the sun can be high throughout the year. UV can stay strong outside a single summer season.'
    : latitude >= 0
      ? 'At this northern latitude, a higher summer sun generally produces more UV than the lower winter sun.'
      : 'At this southern latitude, a higher summer sun generally produces more UV than the lower winter sun.';

  return (
    <div className="uv-facts">
      <section className="fact-section" aria-labelledby="skin-title" id="skin">
        <div className="fact-heading">
          <h2 id="skin-title">Skin and UV</h2>
          <p>Pigmentation affects how readily skin burns. It does not change the UV Index.</p>
          <Source href="https://www.fda.gov/radiation-emitting-products/tanning/your-skin">FDA · skin phototypes</Source>
        </div>
        <div className="fact-content">
          <div className="phototype-grid" aria-label="Typical burn and tanning responses across six skin phototypes">
            {phototypes.map((skin) => (
              <div className="phototype" key={skin.type}>
                <div className="skin-swatch" style={{ backgroundColor: skin.colour }} aria-hidden="true" />
                <span className="phototype-label">Type {skin.type}</span>
                <strong>{skin.response}</strong>
                <span>{skin.tanning}</span>
              </div>
            ))}
          </div>
          <div className="fact-takeaway"><strong>Protection from UVI 3</strong><span>The general recommendation applies across skin tones. Skin and eye damage can occur without visible sunburn.</span></div>
          <p className="fact-note">Phototypes describe typical burning and tanning responses. The colour swatches are illustrative; colour alone cannot identify your sensitivity.</p>
          <Source href={protectionSource}>WHO · protection guidance</Source>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="sky-title" id="sky">
        <div className="fact-heading">
          <h2 id="sky-title">Sky and atmosphere</h2>
          <p>Clouds change the amount and direction of UV reaching the ground. Brightness and temperature are unreliable guides.</p>
          <Source href={environmentalSource}>WHO · environmental factors</Source>
        </div>
        <div className="fact-content">
          <div className="sky-grid">
            <article><Sun aria-hidden="true" /><h3>Clear sky</h3><p>Sun height, ozone and aerosols set the clear-sky UV level.</p></article>
            <article><CloudSun aria-hidden="true" /><h3>Thin / broken cloud</h3><p>Substantial UV can pass through. Scattering can sometimes increase it.</p></article>
            <article><Cloud aria-hidden="true" /><h3>Thick cloud</h3><p>Usually reduces UV. An overcast sky does not guarantee a low UV Index.</p></article>
          </div>
          <dl className="atmosphere-list">
            <div><dt>Ozone</dt><dd>Absorbs UV, particularly UVB. Less overhead ozone generally means more UV at the surface.</dd></div>
            <div><dt>Aerosols</dt><dd>Dust, smoke and pollution absorb and scatter UV. Their effect depends on the particles and their concentration.</dd></div>
          </dl>
          <p className="fact-note">There is no single reliable “cloudy sky” multiplier. The annual chart above uses a clear-sky baseline.</p>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="ground-title" id="ground">
        <div className="fact-heading">
          <h2 id="ground-title">Ground and surroundings</h2>
          <p>Reflected UV reaches you from below and from the sides, adding to direct and scattered sunlight.</p>
          <Source href={environmentalSource}>WHO · surface reflection</Source>
        </div>
        <div className="fact-content">
          <figure className="reflectance-chart">
            <figcaption>Share of incoming UV reflected</figcaption>
            <div className="reflectance-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
            {surfaces.map((surface) => (
              <div className="reflectance-row" key={surface.name}>
                <span>{surface.name}</span>
                <div className="reflectance-track" aria-hidden="true"><div className={surface.bound ? 'reflectance-fill bounded' : 'reflectance-fill'} style={{ width: `${surface.value}%` }} /></div>
                <strong>{surface.label}</strong>
              </div>
            ))}
          </figure>
          <p className="fact-note">Approximate surface reflectances, not percentage increases in your exposure. Striped bars show bounds. Water reflection varies strongly with sun angle; posture and surroundings also matter.</p>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="geography-title" id="geography">
        <div className="fact-heading">
          <h2 id="geography-title">Latitude, seasons and altitude</h2>
          <p>A higher sun sends UV through less atmosphere. At higher elevations, there is also less atmosphere above you.</p>
          <Source href={environmentalSource}>WHO · sun height and altitude</Source>
        </div>
        <div className="fact-content geography-content">
          <div className="location-context"><span>{locationName} · {latitudeLabel}</span><p>{seasonText}</p><p className="fact-note">Clock changes shift the yearly band because the chart uses local civil time. They do not change the sun.</p></div>
          <div className="altitude-example">
            <div className="slider-heading"><label id="altitude-label">Elevation above sea level (m)</label><output>{altitude.toLocaleString('en')} m</output></div>
            <Slider aria-labelledby="altitude-label" value={[altitude]} onValueChange={(value) => setAltitude(Array.isArray(value) ? value[0] : value)} min={0} max={3000} step={250} />
            <div className="slider-endpoints" aria-hidden="true"><span>Sea level</span><span>3,000 m</span></div>
            <div className="altitude-result" aria-live="polite"><strong>+{(altitude / 100).toFixed(altitude % 100 === 0 ? 0 : 1)}%</strong><span>illustrative UV increase</span></div>
            <p className="fact-note">About 10% per 1,000 m, under otherwise similar conditions. This illustration does not alter the annual chart’s sea-level baseline.</p>
          </div>
        </div>
      </section>

      <section className="fact-section" aria-labelledby="duration-title" id="duration">
        <div className="fact-heading">
          <h2 id="duration-title">Intensity × time</h2>
          <p>Exposure accumulates. Twice the time at the same UV Index gives twice the ambient UV dose.</p>
          <Source href="https://www.arpansa.gov.au/our-services/monitoring/ultraviolet-radiation-monitoring/ultraviolet-radiation-dose">ARPANSA · UV exposure and dose</Source>
        </div>
        <div className="fact-content">
          <div className="dose-controls">
            <div><div className="slider-heading"><label id="intensity-label">UV Index</label><output>{intensity}</output></div><Slider aria-labelledby="intensity-label" value={[intensity]} onValueChange={(value) => setIntensity(Array.isArray(value) ? value[0] : value)} min={1} max={12} step={1} /><div className="slider-endpoints" aria-hidden="true"><span>1</span><span>12</span></div></div>
            <div><div className="slider-heading"><label id="duration-label">Time outside (minutes)</label><output>{minutes} min</output></div><Slider aria-labelledby="duration-label" value={[minutes]} onValueChange={(value) => setMinutes(Array.isArray(value) ? value[0] : value)} min={5} max={180} step={5} /><div className="slider-endpoints" aria-hidden="true"><span>5 min</span><span>3 hours</span></div></div>
          </div>
          <div className="dose-result" aria-live="polite">
            <div><strong>{dose.toFixed(2).replace(/\.?0+$/, '')}</strong><span>UVI-hours</span></div>
            <p>Same ambient dose as <strong>UVI {intensity * 2} for {minutes / 2} minutes</strong>.</p>
          </div>
          <div className="dose-comparison" aria-label="Equal ambient dose from a longer exposure and a shorter exposure at twice the UV Index">
            <div className="dose-example"><span>UVI {intensity} · {minutes} min</span><div className="dose-block-space"><div className="dose-block" style={{ width: '100%', height: 36 }} /></div></div>
            <div className="dose-example"><span>UVI {intensity * 2} · {minutes / 2} min</span><div className="dose-block-space"><div className="dose-block" style={{ width: '50%', height: 72 }} /></div></div>
          </div>
          <p className="fact-note">Equal areas represent equal ambient dose: UV Index × hours. Both examples assume constant UV. The dose reaching your skin depends on shade, clothing and orientation; these are not safe-time limits.</p>
        </div>
      </section>
    </div>
  );
}
