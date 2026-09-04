import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTO_BACKUP_INTERVAL_MS, maybeRunAutoBackup } from "./autoBackup";

const exportBackupToPath = vi.fn();
const getState = vi.fn();
const setLastAutoBackupAt = vi.fn();

vi.mock("./exportBackup", () => ({
  buildDefaultBackupFilename: () => "facturador-backup-2026-07-18.facturador-backup.zip",
  joinBackupPath: (folder: string, filename: string) => `${folder}/${filename}`,
  exportBackupToPath: (...args: unknown[]) => exportBackupToPath(...args),
}));

vi.mock("../storage/runtime", () => ({
  isTauriRuntime: () => true,
}));

vi.mock("../../app/store/appStore", () => ({
  useAppStore: {
    getState: () => getState(),
  },
}));

describe("maybeRunAutoBackup", () => {
  beforeEach(() => {
    exportBackupToPath.mockReset();
    setLastAutoBackupAt.mockReset();
    getState.mockReturnValue({
      autoBackupEnabled: true,
      autoBackupFolderPath: "/backups",
      lastAutoBackupAt: null,
      setLastAutoBackupAt,
    });
    exportBackupToPath.mockResolvedValue({
      status: "success",
      path: "/backups/facturador-backup-2026-07-18.facturador-backup.zip",
    });
  });

  it("skips when auto-backup is disabled", async () => {
    getState.mockReturnValue({
      autoBackupEnabled: false,
      autoBackupFolderPath: "/backups",
      lastAutoBackupAt: null,
      setLastAutoBackupAt,
    });

    const result = await maybeRunAutoBackup();
    expect(result).toEqual({ status: "skipped", reason: "disabled" });
    expect(exportBackupToPath).not.toHaveBeenCalled();
  });

  it("skips when the backup is not due yet", async () => {
    const now = new Date("2026-07-18T12:00:00.000Z");
    getState.mockReturnValue({
      autoBackupEnabled: true,
      autoBackupFolderPath: "/backups",
      lastAutoBackupAt: new Date(now.getTime() - AUTO_BACKUP_INTERVAL_MS + 60_000).toISOString(),
      setLastAutoBackupAt,
    });

    const result = await maybeRunAutoBackup(now);
    expect(result).toEqual({ status: "skipped", reason: "not_due" });
    expect(exportBackupToPath).not.toHaveBeenCalled();
  });

  it("exports and records the last auto-backup timestamp when due", async () => {
    const now = new Date("2026-07-18T12:00:00.000Z");

    const result = await maybeRunAutoBackup(now);

    expect(exportBackupToPath).toHaveBeenCalledWith(
      "/backups/facturador-backup-2026-07-18.facturador-backup.zip",
    );
    expect(setLastAutoBackupAt).toHaveBeenCalledWith(now.toISOString());
    expect(result.status).toBe("success");
  });
});
