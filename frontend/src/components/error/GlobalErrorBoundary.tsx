// yss_orbit\frontend\src\components\error\GlobalErrorBoundary.tsx
/**
 * YSS Orbit — Global Error Boundary
 * Catches unhandled React render errors. Shows friendly error UI.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[YSS Orbit] Unhandled React error:', error, info);
    // Sentry capture
    try {
      (window as any).Sentry?.captureException(error, { extra: { componentStack: info.componentStack } });
    } catch (e) {
      console.debug('Failed to send to Sentry', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '24px',
          padding: '32px',
          background: 'var(--color-background)',
          fontFamily: 'var(--font-sans)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '480px' }}>
            An unexpected error occurred. Our team has been notified. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '10px 24px',
              fontSize: 'var(--font-size-md)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-error)',
              background: 'var(--color-error-light)',
              padding: '16px',
              borderRadius: '8px',
              maxWidth: '600px',
              overflow: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
