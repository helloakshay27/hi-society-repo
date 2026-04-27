import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

/**
 * ErrorBoundary catches render errors and prevents blank white screens.
 * - ChunkLoadError (stale JS chunks after deploy): auto-reloads the page once.
 * - Other errors: shows a friendly message with retry and go-back options.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk");

    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Auto-reset error when children change (e.g. route navigation)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.handleReset();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
    this.props.onReset?.();
  };

  handleReload = () => {
    // Mark that we already tried reloading to avoid infinite reload loops
    const reloadKey = "eb_chunk_reload";
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem(reloadKey);
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // ChunkLoadError: stale chunks after new deployment — auto-reload
      if (this.state.isChunkError) {
        return (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 bg-white">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-gray-800">
                New update available
              </h2>
              <p className="text-sm text-gray-500">
                The app was updated. Please reload to continue.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-[#C72030] text-white rounded-lg text-sm font-medium hover:bg-[#a01828] transition-colors"
            >
              Reload page
            </button>
          </div>
        );
      }

      // Generic render error
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 bg-white">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500">
              This page encountered an error. Try going back or retrying.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Go back
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-[#C72030] text-white rounded-lg text-sm font-medium hover:bg-[#a01828] transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorBoundary is an ErrorBoundary that resets automatically
 * whenever the URL (location key) changes. Use it to wrap <Outlet /> or
 * individual route page components so a broken page never persists.
 */
interface RouteErrorBoundaryProps {
  children: ReactNode;
  locationKey: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
  prevLocationKey: string;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
      prevLocationKey: props.locationKey,
    };
  }

  static getDerivedStateFromError(error: Error) {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk");

    return { hasError: true, error, isChunkError };
  }

  static getDerivedStateFromProps(
    props: RouteErrorBoundaryProps,
    state: RouteErrorBoundaryState
  ): Partial<RouteErrorBoundaryState> | null {
    // Reset error state when route changes
    if (props.locationKey !== state.prevLocationKey) {
      return {
        hasError: false,
        error: null,
        isChunkError: false,
        prevLocationKey: props.locationKey,
      };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[RouteErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReload = () => {
    const reloadKey = "eb_chunk_reload";
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem(reloadKey);
      this.setState({ hasError: false, error: null, isChunkError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 bg-white">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-gray-800">
                New update available
              </h2>
              <p className="text-sm text-gray-500">
                The app was updated. Please reload to continue.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-[#C72030] text-white rounded-lg text-sm font-medium hover:bg-[#a01828] transition-colors"
            >
              Reload page
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 bg-white">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500">
              This page encountered an error. Try going back or retrying.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Go back
            </button>
            <button
              onClick={() =>
                this.setState({ hasError: false, error: null, isChunkError: false })
              }
              className="px-4 py-2 bg-[#C72030] text-white rounded-lg text-sm font-medium hover:bg-[#a01828] transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
