import test from 'node:test';
import assert from 'node:assert/strict';
import { tooltipPosition } from '../lib/tooltip-position.ts';

test('chart cards stay inside desktop and mobile screens and clear of the pointer', () => {
  for (const [viewportWidth, viewportHeight] of [[1440, 900], [800, 900], [320, 568], [568, 320]]) {
    for (const width of [180, Math.min(352, viewportWidth - 16)]) {
      for (const height of [90, 160, 360]) {
        for (const x of [0, 8, viewportWidth / 2, viewportWidth - 8, viewportWidth]) {
          for (const y of [0, 8, viewportHeight / 2, viewportHeight - 8, viewportHeight]) {
            const position = tooltipPosition({ x, y }, width, height, viewportWidth, viewportHeight);
            const bottom = position.top + Math.min(height, position.maxHeight);
            assert.ok(position.left >= 8 && position.left + width <= viewportWidth - 8);
            assert.ok(position.top >= 8 && bottom <= viewportHeight - 8);
            assert.ok(bottom <= y - 18 || position.top >= y + 18, 'pointer has an 18px vertical gap');
          }
        }
      }
    }
  }
});
