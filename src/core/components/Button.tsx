import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-sm",
  secondary:
    "bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
  danger:
    "bg-[var(--color-danger)] text-[var(--color-on-primary)] hover:bg-[var(--color-danger-hover)] shadow-sm",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5 min-h-[36px] gap-1.5",
  md: "text-sm sm:text-base px-4 py-2 min-h-[44px] gap-2",
  lg: "text-base px-6 py-3 min-h-[48px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
