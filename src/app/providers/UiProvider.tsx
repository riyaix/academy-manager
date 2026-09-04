import type { ReactNode } from "react";
import { ConfirmDialogProvider } from "../../core/components/ConfirmDialog";
import { ToastProvider } from "../../core/components/Toast";

type UiProviderProps = {
  children: ReactNode;
};

/** Wraps toast and confirm-dialog providers for the design system. */
export function UiProvider({ children }: UiProviderProps) {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </ToastProvider>
  );
}
