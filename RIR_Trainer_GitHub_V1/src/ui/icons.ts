export type IconName = 'calendar' | 'chart' | 'settings' | 'chevron-right' | 'back' | 'check' | 'timer' | 'dumbbell' | 'heart' | 'cloud' | 'wifi-off' | 'play' | 'plus' | 'x' | 'fire' | 'edit' | 'refresh';

const paths: Record<IconName, string> = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08V22h-4v-1.92L9.84 20a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1L3.92 14H2v-4h1.92L4 9.92a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88L4.2 6.98 7.03 4.15l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6l.08-.08V2h4v1.92L14.16 4a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.08.38.28.73.6 1l.08.08H22v4h-1.92L20 14a1.7 1.7 0 0 0-.6 1Z"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  dumbbell: '<path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  cloud: '<path d="M17.5 19H6a4 4 0 1 1 1.2-7.8A6 6 0 0 1 18.7 9 5 5 0 0 1 17.5 19Z"/>',
  'wifi-off': '<path d="M2 8.8A15 15 0 0 1 5.1 6.7M8.5 4.7A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 3.4-2M12.5 9a10 10 0 0 1 6.5 3.5M8.5 16a5 5 0 0 1 7 0M12 20h.01M2 2l20 20"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  fire: '<path d="M12 22c4.4 0 8-3.1 8-7.5 0-3-1.6-5.4-4.3-7.7.1 2-1.2 3.3-2.3 3.7.5-3.4-1.5-6-4.4-8.5.2 3.3-1.7 5.3-3.2 7.2C4.6 10.8 4 12.6 4 14.5 4 18.9 7.6 22 12 22Z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
};

export function icon(name: IconName, size = 22, className = ''): string {
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
