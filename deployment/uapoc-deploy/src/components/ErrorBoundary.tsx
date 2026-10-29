import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-primary-900 p-4">
          <div className="bg-gradient-to-br from-primary-800 to-primary-700 rounded-xl p-8 border border-status-error border-opacity-50 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-status-error bg-opacity-20 rounded-full">
                <AlertTriangle className="h-8 w-8 text-status-error" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Something went wrong
            </h3>
            <p className="text-text-muted mb-6">
              An unexpected error occurred while loading this module. 
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-4 bg-primary-900 rounded-lg text-left">
                  <summary className="cursor-pointer text-sm text-status-error">Error Details</summary>
                  <pre className="mt-2 text-xs text-text-muted overflow-auto">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center space-x-2 px-4 py-2 bg-accent-teal hover:bg-opacity-80 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-text-primary rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;