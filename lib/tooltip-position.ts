export type PointerPosition = { x: number; y: number };

export function tooltipPosition(pointer: PointerPosition, width: number, height: number, viewportWidth: number, viewportHeight: number) {
  const gap = 18, padding = 8;
  const above = Math.max(0, pointer.y - gap - padding);
  const below = Math.max(0, viewportHeight - pointer.y - gap - padding);
  const left = Math.max(padding, Math.min(pointer.x + gap + width <= viewportWidth - padding
    ? pointer.x + gap : pointer.x - width - gap, viewportWidth - width - padding));
  const placeAbove = height <= above || above >= below;
  const maxHeight = placeAbove ? above : below;
  return { left, top: placeAbove ? pointer.y - gap - Math.min(height, maxHeight) : pointer.y + gap, maxHeight };
}
