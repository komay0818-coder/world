const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'battle-typography.css'), 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(html.includes('styles/battle-typography.css?v=20261010-left-rail-v3'), 'typography V3 stylesheet should be loaded last');
expect(css.includes('--battle-font-map-title: 20px'), 'map title size should be 20px');
expect(css.includes('--battle-font-panel-title: 18px'), 'skill panel title size should be 18px');
expect(css.includes('--battle-font-player-name: 17px'), 'player name size should be 17px');
expect(css.includes('--battle-font-monster-name: 16px'), 'monster name size should be 16px');
expect(css.includes('--battle-font-section-title: 16px'), 'combat log title size should be 16px');
expect(css.includes('--battle-font-skill-name: 15px'), 'skill and menu text size should be 15px');
expect(css.includes('--battle-font-player-value: 15px'), 'player resource values should be 15px');
expect(css.includes('--battle-font-label: 14px'), 'labels and combat log entries should be 14px');
expect(css.includes('--battle-font-secondary: 13px'), 'secondary size should be 13px');
expect(css.includes('font-size: 17px !important'), 'suppression title should be 17px');
expect(css.includes('.suppression-row-head b { font-size: 16px !important'), 'facility names should be 16px');
expect(css.includes('.suppression-row small { font-size: 15px !important'), 'suppression effects should be 15px');
expect(css.includes('.combat-log-head p {'), 'combat log title should have a dedicated rule');
expect(css.includes('font-size: 18px !important'), 'combat log title should be 18px');
expect(css.includes('.combat-log-head button { font-size: 15px !important'), 'combat log filters should be 15px');
expect(css.includes('.combat-log-entry time { font-size: 12px !important'), 'combat timestamps should be 12px');
expect(css.includes('width: 200px !important'), 'player info should use the 200px desktop target');
expect(css.includes('height: 12px !important'), 'player resource bars should use the 12px desktop target');
expect(css.includes('overflow-y: auto !important'), 'combat log should keep independent scrolling');
expect(css.includes('translate: -50% 0 !important'), 'first party member should remain centered at narrow desktop widths');
expect(css.includes('grid-template-areas: "icon name cooldown" "icon meta cooldown" !important'), 'narrow desktop skills should keep full names without widening the rail');
expect(css.includes('grid-template-areas: "talent-icon talent-copy" "talent-state talent-state" !important'), 'narrow desktop race talent text should wrap without clipping');
expect(css.includes('(max-width: 1700px)'), 'narrow desktop should make the side panels obey their grid columns');
expect(css.includes('width: calc(var(--battle-left-column, 22%) - 8px) !important'), 'combat log should remain inside its narrow desktop grid column');
expect(css.includes('height: calc(100dvh - 310px) !important'), 'combat log should remain inside short desktop viewports');
expect(css.includes('.battle-bottom .skill-panel { width: 100% !important; }'), 'skill panel should remain inside the viewport at 1280px');
expect(!css.includes('transform: scale('), 'typography must not use global transform scaling');
expect(!css.includes('.monster-slot-hp'), 'monster HP bar sizing must remain unchanged');

console.log('Battle typography tests passed.');
