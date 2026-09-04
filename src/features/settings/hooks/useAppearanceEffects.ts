import { useEffect } from "react";
import { useAppStore, type AppStoreState } from "../../../app/store/appStore";
import { applyBrandColor } from "../../../core/theme/brandColor";
import {
  applyColorScheme,
  normalizeColorScheme,
  persistColorScheme,
  type ColorSchemePreference,
} from "../../../core/theme/colorScheme";
import { applyAppFont, applyFontSize, normalizeFontSize } from "../../../core/theme/fonts";

/** Applies global appearance tokens from settings store. */
export function useAppearanceEffects(): void {
  const fontSize = useAppStore((state: AppStoreState) => state.fontSize);
  const brandColor = useAppStore((state: AppStoreState) => state.brandColor);
  const colorScheme = useAppStore((state: AppStoreState) => state.colorScheme);

  useEffect(() => {
    applyAppFont();
  }, []);

  useEffect(() => {
    applyFontSize(normalizeFontSize(fontSize));
  }, [fontSize]);

  useEffect(() => {
    applyBrandColor(brandColor);
  }, [brandColor]);

  useEffect(() => {
    const preference = normalizeColorScheme(colorScheme);
    applyColorScheme(preference);
    persistColorScheme(preference);

    if (preference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyColorScheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [colorScheme]);
}

export type { ColorSchemePreference };
