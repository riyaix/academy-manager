import { useEffect } from "react";

export type KeyboardShortcut = {
  id: string;
  keys: string;
  descriptionKey: string;
  handler: () => void;
  /** When true, shortcut fires even inside inputs (default false). */
  allowInInput?: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function matchesShortcut(event: KeyboardEvent, combo: string): boolean {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim());
  const key = parts[parts.length - 1];
  const needsCtrl = parts.includes("ctrl") || parts.includes("cmd");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");

  const eventKey = event.key.toLowerCase();
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  if (needsCtrl && !ctrlOrMeta) return false;
  if (!needsCtrl && ctrlOrMeta && key.length === 1) return false;
  if (needsShift !== event.shiftKey) return false;
  if (needsAlt !== event.altKey) return false;

  if (key === "?") return eventKey === "?" || (event.shiftKey && eventKey === "/");
  return eventKey === key;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (!matchesShortcut(event, shortcut.keys)) continue;
        if (!shortcut.allowInInput && isEditableTarget(event.target)) continue;
        event.preventDefault();
        shortcut.handler();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, shortcuts]);
}
