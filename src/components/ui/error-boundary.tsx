'use client';

/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

import React from 'react';
import { Button } from './button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Filter out browser extension errors
    if (
      error.message?.includes('resource.clone') ||
      error.message?.includes('ambire-inpage')
    ) {
      // Don't show error boundary for browser extension issues
      return { hasError: false, error: null };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Filter out browser extension errors
    if (
      error.message?.includes('resource.clone') ||
      error.message?.includes('ambire-inpage')
    ) {
      // Silently ignore browser extension errors
      return;
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            {this.state.error.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={this.resetError}>Try Again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}




