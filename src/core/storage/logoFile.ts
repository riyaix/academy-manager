import { invoke } from "@tauri-apps/api/core";
import { decodeLogoDataUrl, encodeLogoDataUrl } from "../backup/logo";
import { isTauriRuntime } from "./runtime";

/** Logo file name in the Tauri app config directory. */
export const LOGO_FILE_NAME = "logo.png";

export async function readLogoBytes(): Promise<Uint8Array | null> {
  if (!isTauriRuntime()) return null;

  const bytes = await invoke<number[] | null>("read_logo_png");
  if (!bytes?.length) return null;
  return new Uint8Array(bytes);
}

export async function readLogoDataUrl(): Promise<string | null> {
  const bytes = await readLogoBytes();
  if (!bytes) return null;
  return encodeLogoDataUrl(bytes);
}

export async function writeLogoFromDataUrl(dataUrl: string): Promise<void> {
  if (!isTauriRuntime()) return;

  const bytes = decodeLogoDataUrl(dataUrl);
  if (!bytes) {
    throw new Error("Invalid logo image data.");
  }

  await invoke("write_logo_png", { pngBytes: Array.from(bytes) });
}

export async function deleteLogoFile(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("delete_logo_png");
}
