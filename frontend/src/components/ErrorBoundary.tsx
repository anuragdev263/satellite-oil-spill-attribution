import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Application error boundary caught an error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="data-state data-state-full">
        <span className="panel-kicker">APPLICATION ERROR</span>
        <h1>OilSpill Intelligence could not render this workspace.</h1>
        <p>{this.state.error.message}</p>
      </main>
    );
  }
}
