import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { getDatabase } from "../storage/database";
import { readLogoBytes } from "../storage/logoFile";
import { getSchemaVersion } from "../storage/migrations";
import { isTauriRuntime } from "../storage/runtime";
import { BACKUP_FILE_EXTENSION } from "./constants";
import { buildBackupMetadata } from "./metadata";

export type ExportBackupResult =
  | { status: "success"; path: string }
  | { status: "cancelled" }
  | { status: "error"; message: string };

function buildDefaultBackupFilename(date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return `academy-manager-backup-${day}.${BACKUP_FILE_EXTENSION}`;
}

function joinBackupPath(folderPath: string, filename: string): string {
  const separator = folderPath.includes("\\") ? "\\" : "/";
  const normalizedFolder = folderPath.replace(/[\\/]+$/, "");
  return `${normalizedFolder}${separator}${filename}`;
}

async function createBackupArchiveAtPath(destinationPath: string): Promise<string> {
  const db = await getDatabase();
  await db.execute("PRAGMA wal_checkpoint(TRUNCATE)");

  const schemaInfo = await getSchemaVersion(db);
  if (!schemaInfo) {
    throw new Error("Database schema version is missing.");
  }

  const metadata = buildBackupMetadata(schemaInfo.version);
  const logoBytes = await readLogoBytes();

  return invoke<string>("create_backup_archive", {
    request: {
      destinationPath,
      metadataJson: `${JSON.stringify(metadata, null, 2)}\n`,
      logoPngBytes: logoBytes ? Array.from(logoBytes) : null,
    },
  });
}

/** Export a `.academy-manager-backup.zip` to a known destination path (no dialog). */
export async function exportBackupToPath(destinationPath: string): Promise<ExportBackupResult> {
  if (!isTauriRuntime()) {
    return {
      status: "error",
      message: "Backup export is only available in the desktop app.",
    };
  }

  try {
    const path = await createBackupArchiveAtPath(destinationPath);
    return { status: "success", path };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "error", message };
  }
}

/** Export a `.academy-manager-backup.zip` via the native save dialog. */
export async function exportBackup(): Promise<ExportBackupResult> {
  if (!isTauriRuntime()) {
    return {
      status: "error",
      message: "Backup export is only available in the desktop app.",
    };
  }

  try {
    const destinationPath = await save({
      defaultPath: buildDefaultBackupFilename(),
      filters: [
        {
          name: "Academy Manager Backup",
          extensions: [BACKUP_FILE_EXTENSION],
        },
      ],
    });

    if (!destinationPath) {
      return { status: "cancelled" };
    }

    return exportBackupToPath(destinationPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "error", message };
  }
}

export { buildDefaultBackupFilename, joinBackupPath };
