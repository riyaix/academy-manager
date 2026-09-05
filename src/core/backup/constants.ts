export const BACKUP_FORMAT_VERSION = 1;

export const BACKUP_FILE_EXTENSION = "academy-manager-backup.zip";

/** Entries inside a `.academy-manager-backup.zip` archive. */
export const BACKUP_ARCHIVE_ENTRIES = {
  database: "academy-manager.db",
  metadata: "metadata.json",
  logo: "logo.png",
} as const;
