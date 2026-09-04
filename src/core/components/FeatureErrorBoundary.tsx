import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

type FeatureErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  body: string;
  reloadLabel: string;
};

type FeatureErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  state: FeatureErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[FeatureErrorBoundary]", error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center"
      >
        <AlertTriangle className="size-10 text-[var(--color-danger)]" aria-hidden />
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-bold text-[var(--color-text)]">{this.props.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{this.props.body}</p>
          {this.state.message ? (
            <p className="font-mono text-xs text-[var(--color-text-muted)]">{this.state.message}</p>
          ) : null}
        </div>
        <Button type="button" onClick={this.handleReload} leftIcon={<RotateCcw className="size-4" aria-hidden />}>
          {this.props.reloadLabel}
        </Button>
      </div>
    );
  }
}
