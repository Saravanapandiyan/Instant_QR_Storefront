import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Purge any legacy Service Worker from previous builds
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const r of registrations) {
      r.unregister();
    }
  });
}

// Fail-safe: If a rogue service worker served customer index.html on admin or owner URLs, redirect immediately
if (typeof window !== 'undefined') {
  const path = window.location.pathname;
  if (path.startsWith('/admin') || path.startsWith('/owner')) {
    window.location.reload();
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
