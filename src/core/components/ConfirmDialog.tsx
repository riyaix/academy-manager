import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const requestRef = useRef<ConfirmRequest | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const next: ConfirmRequest = { ...options, resolve };
      requestRef.current = next;
      setRequest(next);
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    const current = requestRef.current;
    if (!current) return;
    current.resolve(confirmed);
    requestRef.current = null;
    setRequest(null);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={request !== null}
        onClose={() => close(false)}
        title={request?.title}
        size="sm"
        hideCloseButton
        footer={
          request ? (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => close(false)} className="w-full sm:w-auto">
                {request.cancelLabel ?? t("common.cancel")}
              </Button>
              <Button
                variant={request.variant === "danger" ? "danger" : "primary"}
                onClick={() => close(true)}
                className="w-full sm:w-auto"
              >
                {request.confirmLabel ?? t("common.confirm")}
              </Button>
            </div>
          ) : undefined
        }
      >
        {request && <p className="text-sm sm:text-base text-[var(--color-text-muted)]">{request.message}</p>}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return context;
}
