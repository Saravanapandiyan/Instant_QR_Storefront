import React, { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Purge any legacy Service Worker from previous builds
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const r of registrations) {
      r.unregister();
    }
  });
}

// Pre-hydrate dark/light theme & PWA status bar to prevent flash
try {
  const saved = localStorage.getItem('instant-qr-theme');
  const isDark = !saved || JSON.parse(saved).state?.theme !== 'light';
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (isDark) {
    document.documentElement.classList.add('dark');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#09090b');
  } else {
    document.documentElement.classList.remove('dark');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff');
  }
} catch {
  document.documentElement.classList.add('dark');
}

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
    console.error('Owner Portal Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('instant-qr-owner-auth');
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    } catch {}
    window.location.href = '/owner/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
          <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Owner Portal Session Expired</h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '24px', lineHeight: 1.5 }}>
              A previous session cache was detected. Click below to reset local session cache and open the Owner sign in.
            </p>
            <button
              onClick={this.handleReset}
              style={{ width: '100%', padding: '12px 20px', backgroundColor: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
