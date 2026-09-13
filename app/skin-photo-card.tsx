'use client';

import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { skinPhotos } from '@/lib/skin-photos';
import { useLanguage } from './language';

export default function SkinPhotoCard({ type, response }: { type: string; response: string }) {
  const { t } = useLanguage();
  const example = skinPhotos[type];
  const photo = example.photo;
  return <Popover>
    <PopoverTrigger openOnHover delay={180} closeDelay={200} className="skin-type-trigger" aria-label={t('Type {type}: view skin photo examples', { type })}>
      <strong>{t('Type')} {type}</strong><small>{t(response)}</small>
    </PopoverTrigger>
    <PopoverContent className="skin-photo-card" side="bottom" align="start" sideOffset={16}>
      <PopoverTitle>{t('Type')} {type} · {t(example.tone)}</PopoverTitle>
      {photo ? <>
        <figure className="skin-photo-example">
          <svg viewBox={photo.crop.join(' ')} style={{ width: photo.displayWidth ?? 240, aspectRatio: `${photo.crop[2]} / ${photo.crop[3]}` }} role="img" aria-label={t('Healthy skin, type {type} — {region}', { type, region: t(photo.region) })}>
            <image href={photo.src} width={photo.width} height={photo.height} />
          </svg>
          <figcaption>{t('Healthy volunteer')} · {t(photo.region)}</figcaption>
        </figure>
        <p className="skin-photo-source">
          <a href={photo.source} target="_blank" rel="noreferrer">{t(photo.study)} · {t('Sample {id}', { id: photo.id })} ↗</a>
          <span>© {photo.credit} · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{t(photo.license)}</a></span>
        </p>
      </> : <p className="skin-photo-unavailable">{t('No verified healthy-skin photo is available for this type in the selected sources.')}</p>}
      <PopoverDescription>{t('Study-labelled phototype. Body area and lighting differ between examples: this is not a colour scale or a way to determine your type or UV tolerance.')}</PopoverDescription>
    </PopoverContent>
  </Popover>;
}
