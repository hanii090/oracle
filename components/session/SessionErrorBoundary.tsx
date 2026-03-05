'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { WarningIcon, RefreshIcon } from '@/components/icons';

interface SessionErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface SessionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Specialized error boundary for session components.
 * Provides session-specific recovery UI with graceful fallback.
 */
export class SessionErrorBoundary extends Component<SessionErrorBoundaryProps, SessionErrorBoundaryState> {
  constructor(props: SessionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SessionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`SessionErrorBoundary [${this.props.componentName || 'Unknown'}]:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface border border-crimson/20 rounded-lg p-8 text-center">
          <WarningIcon size={40} className="mx-auto mb-4 text-crimson/60" />
          <h3 className="font-cinzel text-sm tracking-[0.15em] text-crimson-bright uppercase mb-3">
            Something Went Wrong
          </h3>
          <p className="font-cormorant italic text-sm text-text-muted mb-6 max-w-md mx-auto">
            {this.props.componentName 
              ? `The ${this.props.componentName} encountered an issue.`
              : 'This component encountered an unexpected issue.'
            }
            {' '}Your session data is safe.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gold/30 text-gold font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/10 transition-colors"
          >
            <RefreshIcon size={14} />
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left bg-raised rounded-lg p-4 border border-border">
              <summary className="font-courier text-xs text-text-muted cursor-pointer">
                Error Details (dev only)
              </summary>
              <pre className="mt-2 text-[10px] text-crimson/80 overflow-auto max-h-32">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
