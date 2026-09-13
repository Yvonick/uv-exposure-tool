'use client';

import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { skinPhotos } from '@/lib/skin-photos';
import { useLanguage } from './language';

export default function SkinPhotoCard({ type, response }: { type: string; response: string }) {
  const { t } = useLanguage();
  const example = skinPhotos[type];
  return <Popover>
    <PopoverTrigger openOnHover delay={180} closeDelay={200} className="skin-type-trigger" aria-label={t('Type {type}: view skin photo examples', { type })}>
      <strong>{t('Type')} {type}</strong><small>{t(response)}</small>
    </PopoverTrigger>
    <PopoverContent className="skin-photo-card" side="bottom" align="start" sideOffset={16}>
      <PopoverTitle>{t('Type')} {type} · {t(example.tone)}</PopoverTitle>
      <div className="skin-photo-pair">
        {example.photos.map((photo) => <figure key={photo.src}>
          <img src={photo.src} alt={t('Portrait of {name}', { name: photo.name })} width={400} height={533} loading="lazy" decoding="async" />
          <figcaption>{photo.name}<a href={photo.source} target="_blank" rel="noreferrer">© {photo.credit} ↗</a><a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></figcaption>
        </figure>)}
      </div>
      <p className="skin-photo-source">{t('Examples cited by')} <a href="https://ochsdermatology.com/fitzpatrick-scale" target="_blank" rel="noreferrer">Ochs Dermatology ↗</a></p>
      <PopoverDescription>{t("Phototype describes burning and tanning response. Photos are examples; appearance alone cannot determine your type.")}</PopoverDescription>
    </PopoverContent>
  </Popover>;
}
