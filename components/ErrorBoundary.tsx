'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-void flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-8 mx-auto mb-8 opacity-60">
            <svg viewBox="0 0 60 30" fill="none">
              <path d="M3 15 C15 3 45 3 57 15 C45 27 15 27 3 15 Z" stroke="#c42847" strokeWidth="0.8" fill="none"/>
              <circle cx="30" cy="15" r="6" stroke="#c42847" strokeWidth="0.8" fill="none"/>
              <circle cx="30" cy="15" r="2.5" fill="#c42847"/>
            </svg>
          </div>
          <h2 className="font-cinzel text-2xl text-crimson-bright mb-4">Something Went Wrong</h2>
          <p className="font-cormorant italic text-text-mid mb-8 max-w-md">
            The Oracle encountered an unexpected disturbance. Please refresh the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-8 py-3 border border-gold/30 text-gold font-cinzel text-sm tracking-[0.2em] uppercase hover:border-gold hover:bg-gold/10 transition-all duration-300 rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
