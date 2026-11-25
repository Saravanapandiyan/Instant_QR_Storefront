import React, { StrictMode } from 'react';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
