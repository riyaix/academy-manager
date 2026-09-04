import { describe, expect, it, vi } from "vitest";
import { migrateAppearanceLogoToFilesystem } from "./migrateAppearanceLogo";

vi.mock("./logoFile", () => ({
  LOGO_FILE_NAME: "logo.png",
  writeLogoFromDataUrl: vi.fn(),
}));

vi.mock("./runtime", () => ({
  isTauriRuntime: () => true,
}));

describe("migrateAppearanceLogoToFilesystem", () => {
  it("returns appearance unchanged when there is no embedded logo", async () => {
    const appearance = {
      brandColor: "#2563eb",
      logoPath: null,
      fontSize: "normal",
      fontPreset: "font-sans",
      colorScheme: "system",
      taxIdSeparator: ".",
    };

    await expect(migrateAppearanceLogoToFilesystem(appearance)).resolves.toEqual(appearance);
  });

  it("moves legacy logoDataUrl values to logoPath", async () => {
    const appearance = {
      brandColor: "#2563eb",
      logoPath: null,
      logoDataUrl: "data:image/png;base64,QUJD",
      fontSize: "normal",
      fontPreset: "font-sans",
      colorScheme: "system",
      taxIdSeparator: ".",
    };

    const migrated = await migrateAppearanceLogoToFilesystem(appearance);
    expect(migrated.logoPath).toBe("logo.png");
    expect("logoDataUrl" in migrated).toBe(false);
  });
});
