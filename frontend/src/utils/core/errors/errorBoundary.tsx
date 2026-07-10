// yss_orbit\frontend\src\core\errors\errorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Send to Sentry or tracking service here
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-lg shadow-sm border border-red-100">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We apologize for the inconvenience. Our team has been notified.</p>
          <button 
            className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md font-medium"
            onClick={() => window.location.reload()}
          >
            Reload application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
