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
          <img src={photo.src} alt={t('Source-labelled phototype {type}: {caption}', { type, caption: t(photo.caption) })} width={640} height={480} loading="lazy" decoding="async" />
          <figcaption>{t(photo.caption)}<a href={photo.source} target="_blank" rel="noreferrer">{photo.credit} ↗</a></figcaption>
        </figure>)}
      </div>
      <PopoverDescription>{t("Phototype describes burning and tanning response. Photos are examples; appearance alone cannot determine your type.")}</PopoverDescription>
      {example.note && <p className="skin-photo-note">{t(example.note)}</p>}
      <p className="skin-photo-license">{t("Images:")} <a href="https://dermnetnz.org/image-licence" target="_blank" rel="noreferrer">{t("CC BY-NC-ND 4.0")}</a>{type === 'VI' && <> {t("· cheek:")} <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">{t("CC BY 4.0")}</a></>}</p>
    </PopoverContent>
  </Popover>;
}
