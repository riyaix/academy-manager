/** Backup archive format version — bump when archive layout changes. */
export const BACKUP_FORMAT_VERSION = 1;

/** Backup file extension (includes the product suffix). */
export const BACKUP_FILE_EXTENSION = "facturador-backup.zip";

/** Entries inside a `.facturador-backup.zip` archive. */
export const BACKUP_ARCHIVE_ENTRIES = {
  database: "facturador.db",
  metadata: "metadata.json",
  logo: "logo.png",
} as const;
