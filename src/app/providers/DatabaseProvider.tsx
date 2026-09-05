import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Database, LoaderCircle } from "lucide-react";
import { initializeDatabase } from "../../core/storage";
import { hydrateAppStore } from "../store/hydrateAppStore";
import { maybeRunAutoBackup } from "../../core/backup";
import { useToast } from "../../core/components/Toast";

type DatabaseInitState =
  | { status: "idle" | "loading" }
  | { status: "ready"; schemaVersion: number }
  | { status: "skipped" }
  | { status: "error"; message: string };

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function useDatabaseInit(): DatabaseInitState {
  const [state, setState] = useState<DatabaseInitState>(() =>
    isTauriRuntime() ? { status: "loading" } : { status: "skipped" },
  );

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let cancelled = false;

    void initializeDatabase()
      .then(async (schemaVersion) => {
        await hydrateAppStore();
        void maybeRunAutoBackup();
        if (!cancelled) {
          setState({ status: "ready", schemaVersion });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("Failed to initialize SQLite database", error);
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

type DatabaseProviderProps = {
  children: ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { t } = useTranslation();
  const initState = useDatabaseInit();
  const { toast } = useToast();

  useEffect(() => {
    if (initState.status !== "error") return;
    toast({
      variant: "error",
      title: t("storage.initErrorTitle"),
      message: t("storage.initErrorBody"),
      duration: 6000,
    });
  }, [initState.status, toast, t]);

  if (initState.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-(--color-surface) text-(--color-text)">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-8 w-8 animate-spin text-(--color-primary)" aria-hidden />
          <p className="text-sm font-medium">{t("storage.initializing")}</p>
        </div>
      </div>
    );
  }

  if (initState.status === "error") {
    const migrationMismatch =
      initState.message.includes("missing in the resolved migrations") ||
      initState.message.includes("has been modified") ||
      initState.message.includes("VersionMismatch") ||
      initState.message.includes("behind expected");

    return (
      <div className="flex min-h-dvh items-center justify-center bg-(--color-surface) p-6 text-(--color-text)">
        <div className="max-w-md rounded-xl border border-(--color-border) bg-(--color-surface-elevated) p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-(--color-danger)">
            <Database className="h-5 w-5" aria-hidden />
            <h1 className="text-base font-semibold">{t("storage.initErrorTitle")}</h1>
          </div>
          <p className="text-sm text-(--color-text-muted)">{t("storage.initErrorBody")}</p>
          {migrationMismatch ? (
            <p className="mt-3 text-sm text-(--color-text-muted)">
              {t("storage.initErrorMigrationHint")}
            </p>
          ) : null}
          <p className="mt-3 rounded-md bg-(--color-surface) p-3 text-xs text-(--color-text)">
            {initState.message}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
