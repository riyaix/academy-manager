import { useEffect } from "react";

const FALLBACK_TITLE = "Academy Manager";

async function syncNativeWindowTitle(title: string): Promise<void> {
  try {
    const { isTauri } = await import("@tauri-apps/api/core");
    if (!isTauri()) {
      return;
    }

    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setTitle(title);
  } catch {
    // Browser-only dev (Vite without Tauri) — document.title is enough.
  }
}

/** Keeps the browser tab and Tauri window title in sync with app branding. */
export function useWindowTitle(appName: string): void {
  const title = appName.trim() || FALLBACK_TITLE;

  useEffect(() => {
    document.title = title;
    void syncNativeWindowTitle(title);
  }, [title]);
}
