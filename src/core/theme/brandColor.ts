/**
 * Applies user brand color to CSS primary tokens.
 *
 * The design system uses OKLCH, so brand colors are converted from hex → OKLCH
 * and adjusted in perceptual lightness to guarantee WCAG AA contrast (4.5:1)
 * against the on-primary label color.
 */

const PRIMARY_VAR = "--color-primary";
const PRIMARY_HOVER_VAR = "--color-primary-hover";
const ON_PRIMARY_VAR = "--color-on-primary";

/* ── sRGB ↔ OKLCH conversion (lightweight, no external deps) ─────────── */

function hexToSrgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return [
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  ];
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lRoot = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mRoot = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sRoot = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ];
}

function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const lRoot = L + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = L - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = L - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot * lRoot * lRoot;
  const m = mRoot * mRoot * mRoot;
  const s = sRoot * sRoot * sRoot;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

type Oklch = { L: number; C: number; h: number };

function hexToOklch(hex: string): Oklch | null {
  const srgb = hexToSrgb(hex);
  if (!srgb) return null;
  const [r, g, b] = srgb.map(srgbToLinear);
  const [L, a, bLab] = linearRgbToOklab(r, g, b);
  const C = Math.sqrt(a * a + bLab * bLab);
  const h = (Math.atan2(bLab, a) * 180) / Math.PI;
  return { L, C, h: h < 0 ? h + 360 : h };
}

function oklchToCss(color: Oklch): string {
  return `oklch(${color.L.toFixed(3)} ${color.C.toFixed(4)} ${color.h.toFixed(1)})`;
}

function oklchToHex(color: Oklch): string {
  const hRad = (color.h * Math.PI) / 180;
  const a = color.C * Math.cos(hRad);
  const b = color.C * Math.sin(hRad);
  const [lr, lg, lb] = oklabToLinearRgb(color.L, a, b);
  const toHex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, linearToSrgb(v))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`;
}

/* ── WCAG AA contrast check in OKLCH ──────────────────────────────────── */

function relativeLuminanceFromOklch(color: Oklch): number {
  const hRad = (color.h * Math.PI) / 180;
  const a = color.C * Math.cos(hRad);
  const b = color.C * Math.sin(hRad);
  const [lr, lg, lb] = oklabToLinearRgb(color.L, a, b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WHITE_LUMINANCE = 1;
const AA_THRESHOLD = 4.5;

/**
 * Ensure the brand color meets AA contrast against white by reducing OKLCH
 * lightness. Returns the adjusted color, or null if the input is invalid.
 */
export function ensureBrandContrast(hex: string): Oklch | null {
  const color = hexToOklch(hex);
  if (!color) return null;

  for (let i = 0; i < 12; i++) {
    const lum = relativeLuminanceFromOklch(color);
    if (contrastRatio(WHITE_LUMINANCE, lum) >= AA_THRESHOLD) return color;
    color.L *= 0.9;
  }
  return color;
}

/** For backward compatibility — returns a hex string or null. */
export function ensureBrandContrastHex(hex: string): string | null {
  const color = ensureBrandContrast(hex);
  return color ? oklchToHex(color) : null;
}

export function applyBrandColor(brandColor: string | null | undefined): void {
  const root = document.documentElement;
  const safe = brandColor ? ensureBrandContrast(brandColor) : null;
  if (!safe) {
    root.style.removeProperty(PRIMARY_VAR);
    root.style.removeProperty(PRIMARY_HOVER_VAR);
    root.style.removeProperty(ON_PRIMARY_VAR);
    return;
  }

  root.style.setProperty(PRIMARY_VAR, oklchToCss(safe));

  const hover = { ...safe, L: safe.L * 0.88 };
  root.style.setProperty(PRIMARY_HOVER_VAR, oklchToCss(hover));
  root.style.setProperty(ON_PRIMARY_VAR, "#ffffff");
}
