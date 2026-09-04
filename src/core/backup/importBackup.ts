import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../../app/store/appStore";
import { hydrateAppStore } from "../../app/store/hydrateAppStore";
import { CURRENT_SCHEMA_VERSION } from "../storage/constants";
import { closeDatabase, getDatabase, initializeDatabase } from "../storage/database";
import { isTauriRuntime } from "../storage/runtime";
import { BACKUP_FILE_EXTENSION } from "./constants";
import { encodeLogoDataUrl } from "./logo";
import type { BackupMetadata } from "./metadata";
import { validateBackupMetadata } from "./metadata";

export type ImportBackupResult =
  | { status: "success"; metadata: BackupMetadata }
  | { status: "cancelled" }
  | { status: "error"; message: string };

type BackupInspection = {
  metadata: BackupMetadata;
  hasLogo: boolean;
};

type RestoreBackupResponse = {
  metadata: BackupMetadata;
  logoPngBytes: number[] | null;
};

function validateSchemaCompatibility(schemaVersion: number): string | null {
  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    return `Backup schema v${schemaVersion} is newer than this app (v${CURRENT_SCHEMA_VERSION}). Update Facturador first.`;
  }
  return null;
}

/** Import a `.facturador-backup.zip` after validation and user confirmation. */
export async function importBackup(
  confirmOverwrite: (metadata: BackupMetadata) => Promise<boolean>,
): Promise<ImportBackupResult> {
  if (!isTauriRuntime()) {
    return {
      status: "error",
      message: "Backup import is only available in the desktop app.",
    };
  }

  try {
    const sourcePath = await open({
      multiple: false,
      filters: [
        {
          name: "Facturador Backup",
          extensions: [BACKUP_FILE_EXTENSION],
        },
      ],
    });

    if (!sourcePath || Array.isArray(sourcePath)) {
      return { status: "cancelled" };
    }

    const inspection = await invoke<BackupInspection>("inspect_backup_archive", {
      sourcePath,
    });

    const metadataError = validateBackupMetadata(inspection.metadata);
    if (metadataError) {
      return { status: "error", message: metadataError };
    }

    const schemaError = validateSchemaCompatibility(inspection.metadata.schemaVersion);
    if (schemaError) {
      return { status: "error", message: schemaError };
    }

    const confirmed = await confirmOverwrite(inspection.metadata);
    if (!confirmed) {
      return { status: "cancelled" };
    }

    const db = await getDatabase();
    await db.execute("PRAGMA wal_checkpoint(TRUNCATE)");
    await closeDatabase();

    const restored = await invoke<RestoreBackupResponse>("restore_backup_archive", {
      sourcePath,
    });

    await initializeDatabase();
    await hydrateAppStore();

    if (restored.logoPngBytes?.length) {
      const dataUrl = encodeLogoDataUrl(new Uint8Array(restored.logoPngBytes));
      useAppStore.getState().setLogoDataUrl(dataUrl);
    } else {
      useAppStore.getState().setLogoDataUrl(null);
    }

    return { status: "success", metadata: restored.metadata };
  } catch (error) {
    try {
      await initializeDatabase();
      await hydrateAppStore();
    } catch {
      // Leave the init error UI to surface a broken database state.
    }

    const message = error instanceof Error ? error.message : String(error);
    return { status: "error", message };
  }
}
