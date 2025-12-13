/**
 * Error Boundary Component
 * Catches React render errors and displays a fallback UI
 */

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center shadow-lg">
                        <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-text mb-2">
                            Algo salió mal
                        </h2>
                        <p className="text-muted mb-6">
                            Ha ocurrido un error inesperado. Por favor intenta de nuevo.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="bg-surface border border-border text-text px-6 py-2 rounded-lg hover:bg-background transition-colors"
                            >
                                Ir al inicio
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
