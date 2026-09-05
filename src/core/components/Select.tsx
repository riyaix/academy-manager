import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "text-sm px-3 py-1.5 min-h-[36px]",
  md: "text-sm sm:text-base px-3 py-2 min-h-[44px]",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, leftIcon, size = "md", children, id: externalId, ...props },
  ref,
) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--color-text-muted)]">
            {leftIcon}
          </span>
        )}
        <select
          ref={ref}
          id={id}
          data-ui-select
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "w-full appearance-none rounded-lg border bg-[var(--color-surface-elevated)] text-[var(--color-text)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "pr-10 cursor-pointer",
            error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
            leftIcon ? "pl-10" : "",
            sizeClasses[size],
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-muted)]"
          aria-hidden
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
});
