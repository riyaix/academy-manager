/** Decode a base64 image data URL into raw bytes for `logo.png` in backups. */
export function decodeLogoDataUrl(dataUrl: string | null | undefined): Uint8Array | null {
  if (!dataUrl?.startsWith("data:")) return null;

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return null;

  const header = dataUrl.slice(0, commaIndex);
  if (!header.includes("base64")) return null;

  const payload = dataUrl.slice(commaIndex + 1);
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/** Encode raw image bytes as a PNG data URL for appearance settings. */
export function encodeLogoDataUrl(bytes: Uint8Array, mimeType = "image/png"): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index++) {
    binary += String.fromCharCode(bytes[index]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}
