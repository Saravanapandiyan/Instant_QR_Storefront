import React, { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Super Admin Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('instant-qr-admin-auth');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/admin/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
          <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Control Plane Session Expired</h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '24px', lineHeight: 1.5 }}>
              A previous session cache was detected. Click below to clear local session cache and open the Super Admin sign in.
            </p>
            <button
              onClick={this.handleReset}
              style={{ width: '100%', padding: '12px 20px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Clear Cache & Go to Sign In
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
