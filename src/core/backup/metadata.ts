import packageJson from "../../../package.json";
import { BACKUP_FORMAT_VERSION } from "./constants";

export type BackupMetadata = {
  formatVersion: number;
  product: "facturador";
  appVersion: string;
  schemaVersion: number;
  exportedAt: string;
};

export function buildBackupMetadata(schemaVersion: number, exportedAt = new Date()): BackupMetadata {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    product: "facturador",
    appVersion: packageJson.version,
    schemaVersion,
    exportedAt: exportedAt.toISOString(),
  };
}

/** Returns an error message when the backup cannot be restored by this app version. */
export function validateBackupMetadata(metadata: BackupMetadata): string | null {
  if (metadata.product !== "facturador") {
    return "Invalid backup product.";
  }

  if (metadata.formatVersion !== BACKUP_FORMAT_VERSION) {
    return `Unsupported backup format version ${metadata.formatVersion}.`;
  }

  if (!Number.isFinite(metadata.schemaVersion) || metadata.schemaVersion < 1) {
    return "Backup schema version is invalid.";
  }

  return null;
}
