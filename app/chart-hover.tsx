'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { tooltipPosition, type PointerPosition } from '@/lib/tooltip-position';
import { useLanguage } from './language';

const ChartPointer = createContext<PointerPosition | null>(null);
const OverflowDetails = createContext<(content: ReactNode) => void>(() => {});

export function ChartHoverSurface({ children }: { children: ReactNode }) {
  const [pointer, setPointer] = useState<PointerPosition | null>(null);
  const [overflowDetails, setOverflowDetails] = useState<ReactNode>(null);
  const { t } = useLanguage();
  useEffect(() => {
    const clear = () => setPointer(null);
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    return () => { window.removeEventListener('scroll', clear, true); window.removeEventListener('resize', clear); };
  }, []);
  return <div className="chart-hover-surface"
    onPointerEnter={(event) => setPointer({ x: event.clientX, y: event.clientY })}
    onPointerMoveCapture={(event) => setPointer({ x: event.clientX, y: event.clientY })}
    onPointerLeave={() => setPointer(null)}
    onFocusCapture={(event) => { if (!pointer) { const rect = event.currentTarget.getBoundingClientRect(); setPointer({ x: rect.left + rect.width / 2, y: rect.top }); } }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPointer(null); }}
    onKeyDownCapture={(event) => {
      if (event.key === 'Escape') { setPointer(null); setOverflowDetails(null); }
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({ x: rect.left + rect.width / 2, y: Math.max(16, rect.top) });
      }
    }}>
    <OverflowDetails.Provider value={setOverflowDetails}><ChartPointer.Provider value={pointer}>{children}</ChartPointer.Provider></OverflowDetails.Provider>
    {overflowDetails && <div className="chart-overflow-details" role="region" aria-label={t('Selected chart details')}
      onPointerEnter={event => event.stopPropagation()} onPointerMove={event => event.stopPropagation()}>
      <button type="button" onClick={() => { setOverflowDetails(null); setPointer(null); }} aria-label={t('Close chart details')}>×</button>
      {overflowDetails}
    </div>}
  </div>;
}

function PositionedTooltip({ pointer, children, className }: { pointer: PointerPosition; children: ReactNode; className?: string }) {
  const showOverflow = useContext(OverflowDetails);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setSize((previous) => {
      const width = element.offsetWidth, height = element.scrollHeight;
      return previous.width === width && previous.height === height ? previous : { width, height };
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const position = tooltipPosition(pointer, size.width, size.height, window.innerWidth, window.innerHeight);
  const clipped = size.height > position.maxHeight + 1;
  useEffect(() => {
    if (size.width && clipped) showOverflow(children);
    else if (size.width) showOverflow(null);
  }, [clipped, size.width, children, showOverflow]);
  return createPortal(<div ref={ref} role="tooltip" className={`chart-tooltip floating-chart-tooltip ${className ?? ''}`}
    style={{ ...position, visibility: size.width && !clipped ? 'visible' : 'hidden' }}>{children}</div>, document.body);
}

export function FloatingChartTooltip({ children, className }: { children: ReactNode; className?: string }) {
  const pointer = useContext(ChartPointer);
  return pointer && typeof document !== 'undefined' ? <PositionedTooltip pointer={pointer} className={className}>{children}</PositionedTooltip> : null;
}
