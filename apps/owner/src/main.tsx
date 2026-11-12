import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';

// Register Service Worker for PWA
registerSW({ immediate: true });

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
