import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";
import { Button } from "./Button";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastInput = {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-[var(--color-border)] bg-[var(--color-success-surface)] text-[var(--color-text)]",
  error: "border-[var(--color-border)] bg-[var(--color-danger-surface)] text-[var(--color-text)]",
  warning:
    "border-[var(--color-border)] bg-[var(--color-warning-surface)] text-[var(--color-text)]",
  info: "border-[var(--color-border)] bg-[var(--color-info-surface)] text-[var(--color-text)]",
};

const variantIcons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  const { t } = useTranslation();
  const Icon = variantIcons[toast.variant];
  const iconColor: Record<ToastVariant, string> = {
    success: "text-[var(--color-success)]",
    error: "text-[var(--color-danger)]",
    warning: "text-[var(--color-warning)]",
    info: "text-[var(--color-primary)]",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg",
        "animate-[slide-in-right_200ms_ease-out] motion-reduce:animate-none",
        variantStyles[toast.variant],
      )}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", iconColor[toast.variant])} aria-hidden />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="font-semibold text-sm sm:text-base">{toast.title}</p>}
        <p className={cn("text-sm", toast.title && "mt-0.5")}>{toast.message}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDismiss(toast.id)}
        aria-label={t("common.close")}
        className="shrink-0 min-h-[44px] min-w-[44px] p-1 -mr-1 -mt-1"
      >
        <X className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? crypto.randomUUID();
      const record: ToastRecord = {
        ...input,
        id,
        variant: input.variant ?? "info",
      };

      setToasts((current) => [...current, record]);

      const duration = input.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-2 p-4 sm:p-6 sm:items-end"
          aria-label={t("a11y.notifications")}
        >
          <div className="flex w-full max-w-md flex-col gap-2 sm:ml-auto">
            {toasts.map((item) => (
              <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
            ))}
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
