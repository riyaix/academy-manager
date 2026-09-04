import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-sm",
        "w-full min-w-0",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-4 sm:p-6 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg sm:text-xl font-bold text-[var(--color-text)] mb-0", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-[var(--color-text-muted)]", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-4 sm:p-6 pt-0",
        className,
      )}
      {...props}
    />
  );
}
