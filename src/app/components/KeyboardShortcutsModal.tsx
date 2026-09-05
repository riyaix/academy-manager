import { useTranslation } from "react-i18next";
import { Keyboard } from "lucide-react";
import { Modal } from "../../core/components/Modal";
import type { KeyboardShortcut } from "../../core/hooks/useKeyboardShortcuts";

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
};

export function KeyboardShortcutsModal({ open, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={t("shortcuts.title")} size="md">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">{t("shortcuts.description")}</p>
        <ul className="divide-y divide-gray-100 rounded-lg border border-[var(--color-border)] overflow-hidden">
          {shortcuts.map((shortcut) => (
            <li
              key={shortcut.id}
              className="flex items-center justify-between gap-4 bg-[var(--color-surface-elevated)] px-4 py-3 text-sm"
            >
              <span className="text-[var(--color-text)]">{t(shortcut.descriptionKey)}</span>
              <kbd className="shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)]">
                {shortcut.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Keyboard className="h-4 w-4" aria-hidden />
          <span>{t("shortcuts.hint")}</span>
        </div>
      </div>
    </Modal>
  );
}
