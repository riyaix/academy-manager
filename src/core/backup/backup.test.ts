import { describe, expect, it } from "vitest";
import { BACKUP_ARCHIVE_ENTRIES, BACKUP_FILE_EXTENSION, BACKUP_FORMAT_VERSION } from "./constants";
import { decodeLogoDataUrl, encodeLogoDataUrl } from "./logo";
import { buildBackupMetadata, validateBackupMetadata } from "./metadata";
import { CURRENT_SCHEMA_VERSION } from "../storage/constants";

describe("backup metadata", () => {
  it("builds metadata with format version and schema", () => {
    const exportedAt = new Date("2026-07-18T10:00:00.000Z");
    const metadata = buildBackupMetadata(2, exportedAt);

    expect(metadata).toEqual({
      formatVersion: BACKUP_FORMAT_VERSION,
      product: "facturador",
      appVersion: expect.any(String),
      schemaVersion: 2,
      exportedAt: "2026-07-18T10:00:00.000Z",
    });
  });
});

describe("decodeLogoDataUrl", () => {
  it("returns null for empty or non-data URLs", () => {
    expect(decodeLogoDataUrl(null)).toBeNull();
    expect(decodeLogoDataUrl("https://example.com/logo.png")).toBeNull();
  });

  it("decodes base64 PNG data URLs", () => {
    const bytes = decodeLogoDataUrl("data:image/png;base64,QUJD");
    expect(bytes).toEqual(new Uint8Array([65, 66, 67]));
  });
});

describe("encodeLogoDataUrl", () => {
  it("round-trips PNG bytes through a data URL", () => {
    const original = new Uint8Array([65, 66, 67]);
    const dataUrl = encodeLogoDataUrl(original);
    expect(decodeLogoDataUrl(dataUrl)).toEqual(original);
  });
});

describe("validateBackupMetadata", () => {
  it("accepts backups from supported schema versions", () => {
    const metadata = buildBackupMetadata(CURRENT_SCHEMA_VERSION);
    expect(validateBackupMetadata(metadata)).toBeNull();
  });

  it("rejects unknown products and formats", () => {
    const metadata = buildBackupMetadata(2);
    expect(validateBackupMetadata({ ...metadata, product: "other" as "facturador" })).toMatch(
      /product/i,
    );
    expect(validateBackupMetadata({ ...metadata, formatVersion: 99 })).toMatch(/format/i);
  });
});

describe("backup constants", () => {
  it("uses the product-specific backup extension", () => {
    expect(BACKUP_FILE_EXTENSION).toBe("facturador-backup.zip");
    expect(BACKUP_ARCHIVE_ENTRIES.database).toBe("facturador.db");
    expect(BACKUP_ARCHIVE_ENTRIES.metadata).toBe("metadata.json");
    expect(BACKUP_ARCHIVE_ENTRIES.logo).toBe("logo.png");
  });
});
