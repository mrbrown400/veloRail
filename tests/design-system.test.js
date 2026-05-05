import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('design system exposes core VeloRail tokens', () => {
  const css = readFileSync('src/styles/design-system.css', 'utf8');
  const requiredTokens = [
    '--vr-color-accent',
    '--vr-color-bike',
    '--vr-color-rail',
    '--vr-font-family-sans',
    '--vr-space-4',
    '--vr-radius-2',
    '--vr-shadow-floating',
    '--vr-z-side-panel'
  ];

  for (const token of requiredTokens) {
    assert.match(css, new RegExp(`${token}:`));
  }
});

test('design system documents reusable component classes', () => {
  const css = readFileSync('src/styles/design-system.css', 'utf8');
  const componentClasses = [
    '.vr-button',
    '.vr-button--map-toggle',
    '.vr-chip',
    '.vr-card',
    '.vr-panel',
    '.velorail-mark'
  ];

  for (const className of componentClasses) {
    assert.ok(css.includes(className), `${className} missing`);
  }
});
