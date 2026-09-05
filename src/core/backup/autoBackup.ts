import { useAppStore } from "../../app/store/appStore";
import { buildDefaultBackupFilename, exportBackupToPath, joinBackupPath } from "./exportBackup";
import { isTauriRuntime } from "../storage/runtime";

/** Minimum interval between automatic backups (7 days). */
export const AUTO_BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export type AutoBackupResult =
  | { status: "skipped"; reason: "disabled" | "no_folder" | "not_due" | "not_desktop" }
  | { status: "success"; path: string }
  | { status: "error"; message: string };

function isAutoBackupDue(lastAutoBackupAt: string | null, now = new Date()): boolean {
  if (!lastAutoBackupAt) return true;

  const lastBackup = new Date(lastAutoBackupAt);
  if (Number.isNaN(lastBackup.getTime())) return true;

  return now.getTime() - lastBackup.getTime() >= AUTO_BACKUP_INTERVAL_MS;
}

/** Create a weekly backup in the configured folder when enabled and due. */
export async function maybeRunAutoBackup(now = new Date()): Promise<AutoBackupResult> {
  if (!isTauriRuntime()) {
    return { status: "skipped", reason: "not_desktop" };
  }

  const state = useAppStore.getState();
  if (!state.autoBackupEnabled) {
    return { status: "skipped", reason: "disabled" };
  }

  if (!state.autoBackupFolderPath) {
    return { status: "skipped", reason: "no_folder" };
  }

  if (!isAutoBackupDue(state.lastAutoBackupAt, now)) {
    return { status: "skipped", reason: "not_due" };
  }

  const destinationPath = joinBackupPath(
    state.autoBackupFolderPath,
    buildDefaultBackupFilename(now),
  );

  const result = await exportBackupToPath(destinationPath);
  if (result.status !== "success") {
    return {
      status: "error",
      message: result.status === "error" ? result.message : "Auto-backup was cancelled.",
    };
  }

  state.setLastAutoBackupAt(now.toISOString());
  return { status: "success", path: result.path };
}
