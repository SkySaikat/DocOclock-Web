// @ts-nocheck
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 font-medium mb-8 max-w-md">
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left bg-slate-900 text-red-300 p-4 rounded-xl text-xs max-w-lg overflow-auto mb-6 font-mono">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.scrollTo(0, 0);
            }}
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
