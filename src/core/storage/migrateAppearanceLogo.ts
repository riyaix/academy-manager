import type { AppearanceSettingsSlice } from "./repositories/settingsRepository";
import { LOGO_FILE_NAME, writeLogoFromDataUrl } from "./logoFile";
import { isTauriRuntime } from "./runtime";

type LegacyAppearanceSettings = AppearanceSettingsSlice & {
  logoDataUrl?: string | null;
};

/** Move embedded logo data URLs from SQLite into `app_data/logo.png`. */
export async function migrateAppearanceLogoToFilesystem(
  appearance: AppearanceSettingsSlice,
): Promise<AppearanceSettingsSlice> {
  const legacy = appearance as LegacyAppearanceSettings;
  if (!legacy.logoDataUrl || appearance.logoPath) {
    const { logoDataUrl: _removed, ...next } = legacy;
    return next;
  }

  if (!isTauriRuntime()) {
    return {
      ...appearance,
      logoPath: appearance.logoPath ?? LOGO_FILE_NAME,
    };
  }

  await writeLogoFromDataUrl(legacy.logoDataUrl);

  const { logoDataUrl: _removed, ...next } = legacy;
  return {
    ...next,
    logoPath: LOGO_FILE_NAME,
  };
}
