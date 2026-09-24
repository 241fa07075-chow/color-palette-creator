// Color math utilities — single source of truth for all three pages.

export interface RGB {
  r: number;
  g: number;
  b: number;
}
export interface HSL {
  h: number;
  s: number;
  l: number;
}

export const INK = "#14141A";
export const CREAM = "#F4F1EA";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (v: number) =>
    clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (hn < 60) [r, g, b] = [c, x, 0];
  else if (hn < 120) [r, g, b] = [x, c, 0];
  else if (hn < 180) [r, g, b] = [0, c, x];
  else if (hn < 240) [r, g, b] = [0, x, c];
  else if (hn < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export const hslToHex = (hsl: HSL) => rgbToHex(hslToRgb(hsl));
export const hexToHsl = (hex: string) => {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
};

export const formatRgb = (rgb: RGB) => `${rgb.r}, ${rgb.g}, ${rgb.b}`;
export const formatHsl = ({ h, s, l }: HSL) => `${h}, ${s}%, ${l}%`;

/** Returns ink or cream — whichever reads better on the given hex. */
export function readableText(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return CREAM;
  const lum =
    (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.6 ? INK : CREAM;
}

/** Mix toward white (t) > 0 or black (t) < 0, t in [-1, 1]. */
export function mix(hex: string, t: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const target = t >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const k = Math.abs(t);
  return rgbToHex({
    r: rgb.r + (target.r - rgb.r) * k,
    g: rgb.g + (target.g - rgb.g) * k,
    b: rgb.b + (target.b - rgb.b) * k,
  });
}

/** 5 steps from light tint to dark shade, middle = original. */
export function tintsAndShades(hex: string): string[] {
  return [-0.72, -0.36, 0, 0.36, 0.72].map((t) => mix(hex, -t));
}

export function randomHex(): string {
  return rgbToHex({
    r: Math.random() * 256,
    g: Math.random() * 256,
    b: Math.random() * 256,
  });
}

export type Harmony = "analogous" | "complementary" | "triadic" | "random";

const HARMONY_OFFSETS: Record<Exclude<Harmony, "random">, number[]> = {
  analogous: [0, 24, 48, 318, 336],
  complementary: [0, 180, 24, 204, 156],
  triadic: [0, 120, 240, 24, 144],
};

/** Generate a 5-color palette around baseHex using a harmony rule. */
export function generatePalette(baseHex: string, mode: Harmony): string[] {
  if (mode === "random")
    return Array.from({ length: 5 }, () => randomHex());
  const base = hexToHsl(baseHex) ?? { h: 16, s: 100, l: 62 };
  return HARMONY_OFFSETS[mode].map((off, i) => {
    const lDelta = [0, 2, -4, 6, -8][i] ?? 0;
    const sDelta = [0, -6, 4, -10, 8][i] ?? 0;
    const l = clamp(base.l + lDelta, 12, 88);
    const s = clamp(base.s + sDelta, 30, 100);
    return hslToHex({ h: base.h + off, s, l });
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
