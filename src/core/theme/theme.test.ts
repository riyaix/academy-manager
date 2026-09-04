import { describe, expect, it } from "vitest";
import { ensureBrandContrast } from "./brandColor";
import { normalizeColorScheme, resolveEffectiveScheme } from "./colorScheme";
import { normalizeFontSize } from "./fonts";

describe("normalizeFontSize", () => {
  it("maps legacy Spanish keys", () => {
    expect(normalizeFontSize("pequeña")).toBe("small");
    expect(normalizeFontSize("grande")).toBe("large");
  });

  it("keeps English keys", () => {
    expect(normalizeFontSize("small")).toBe("small");
    expect(normalizeFontSize("normal")).toBe("normal");
    expect(normalizeFontSize("large")).toBe("large");
  });
});

describe("normalizeColorScheme", () => {
  it("defaults to system", () => {
    expect(normalizeColorScheme(undefined)).toBe("system");
    expect(normalizeColorScheme("nope")).toBe("system");
  });

  it("accepts valid preferences", () => {
    expect(normalizeColorScheme("light")).toBe("light");
    expect(normalizeColorScheme("dark")).toBe("dark");
    expect(normalizeColorScheme("system")).toBe("system");
  });
});

describe("resolveEffectiveScheme", () => {
  it("returns explicit preferences as-is", () => {
    expect(resolveEffectiveScheme("light")).toBe("light");
    expect(resolveEffectiveScheme("dark")).toBe("dark");
  });
});

describe("ensureBrandContrast", () => {
  it("returns an OKLCH object for a sufficiently dark brand color", () => {
    const result = ensureBrandContrast("#2563eb");
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("L");
    expect(result).toHaveProperty("C");
    expect(result).toHaveProperty("h");
  });

  it("reduces lightness for a light brand color", () => {
    const light = ensureBrandContrast("#93c5fd");
    expect(light).not.toBeNull();
    // Light color should have been darkened below its original lightness
    expect(light!.L).toBeLessThan(0.8);
  });

  it("returns null for invalid hex", () => {
    expect(ensureBrandContrast("not-a-color")).toBeNull();
  });

  it("provides ensureBrandContrastHex for hex output", async () => {
    const { ensureBrandContrastHex } = await import("./brandColor");
    const hex = ensureBrandContrastHex("#2563eb");
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
