// HomeSync design tokens — refined dark.
// One warm accent, graphite surfaces, hairline borders. No glass, no neon.

export const C = {
  bg: '#0E0F11',
  surface: '#16181B',
  raised: '#1D2024',
  sunken: '#121315',
  hairline: 'rgba(255,255,255,0.07)',
  hairlineStrong: 'rgba(255,255,255,0.12)',

  text: '#EDEBE7',
  textSoft: '#B5B1AA',
  textMuted: '#7D7973',
  textFaint: '#55524E',

  accent: '#E8A462',
  accentSoft: 'rgba(232,164,98,0.14)',
  onAccent: '#1A1206',

  positive: '#86B89B',
  positiveSoft: 'rgba(134,184,155,0.14)',
  danger: '#E07A66',
  dangerSoft: 'rgba(224,122,102,0.14)',

  // The two partners
  memberA: '#E8A462',
  memberASoft: 'rgba(232,164,98,0.16)',
  memberB: '#8FA8E8',
  memberBSoft: 'rgba(143,168,232,0.16)',
  both: '#B5B1AA',
  bothSoft: 'rgba(181,177,170,0.12)',
};

export const R = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, gutter: 20 };

export const F = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 40 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 28 },
  heading: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.6, lineHeight: 16 },
  number: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.2, lineHeight: 46 },
};

export const CURRENCY = '₪';

export function money(n: number, opts: { decimals?: boolean } = {}): string {
  const v = Math.abs(n);
  const fixed = opts.decimals ? v.toFixed(2) : Math.round(v).toString();
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}${CURRENCY}${grouped}${dec ? '.' + dec : ''}`;
}
