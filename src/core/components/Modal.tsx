import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";
import { Button } from "./Button";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideCloseButton = false,
  closeOnBackdrop = true,
  className,
}: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the panel once when the dialog opens — do not depend on `onClose`, or an
    // unstable callback identity would steal focus from inputs on every parent re-render.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      const previous = previousFocusRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fade-in_150ms_ease-out] motion-reduce:animate-none"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)] cursor-default"
        aria-label={t("common.close")}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative z-10 flex w-full flex-col",
          "max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl",
          "border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-xl",
          "outline-none",
          "animate-[slide-up_200ms_ease-out] motion-reduce:animate-none",
          sizeClasses[size],
          className,
        )}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-4 sm:p-6 shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-lg sm:text-xl font-bold text-[var(--color-text)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label={t("common.close")}
                className="shrink-0 min-h-[44px] min-w-[44px] p-2"
              >
                <X className="size-5" aria-hidden />
              </Button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">{children}</div>
        {footer && (
          <div className="border-t border-[var(--color-border)] p-4 sm:p-6 shrink-0">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
