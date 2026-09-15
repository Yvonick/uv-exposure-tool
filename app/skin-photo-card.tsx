'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { skinPhotos, portraitLineup, phototypeSource } from '@/lib/skin-photos';
import { useLanguage } from './language';

export default function SkinPhotoCard({ type, response }: { type: string; response: string }) {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const example = skinPhotos[type];
  const tileWidth = portraitLineup.width / portraitLineup.columns;
  const tileHeight = portraitLineup.height / portraitLineup.rows;
  return <Popover>
    <PopoverTrigger openOnHover delay={180} closeDelay={200} className="skin-type-trigger" aria-label={t('Type {type}: view skin photo examples', { type })}>
      <strong>{t('Type')} {type}</strong><small>{t(response)}</small>
    </PopoverTrigger>
    <PopoverContent className="skin-photo-card" side="bottom" align="start" sideOffset={16} initialFocus={(interaction) => interaction === 'keyboard'}>
      <PopoverTitle>{t('Type')} {type} · {t(example.tone)}</PopoverTitle>
      <p className="skin-illustration-label">{t('AI-generated illustrations')}</p>
      {!loaded && <p className="skin-image-status" role="status">{t(imageError ? 'Illustrations unavailable.' : 'Loading illustrations…')}</p>}
      <div className="skin-portrait-pair">
        {[0, 1].map((row) => <svg key={row}
          viewBox={`${example.column * tileWidth} ${row * tileHeight} ${tileWidth} ${tileHeight}`}
          role="img" aria-label={t('Fictional portrait {number} · {tone}', { number: row + 1, tone: t(example.tone) })}>
          <image href={portraitLineup.src} width={portraitLineup.width} height={portraitLineup.height} onLoad={() => { setLoaded(true); setImageError(false); }} onError={() => setImageError(true)} />
        </svg>)}
      </div>
      <PopoverDescription>{t('Fictional faces; phototype depends on burning and tanning, not skin tone alone.')}</PopoverDescription>
      <p className="skin-photo-source"><a href={phototypeSource} target="_blank" rel="noreferrer">{t('Phototype descriptions: DermNet')} ↗</a></p>
    </PopoverContent>
  </Popover>;
}
