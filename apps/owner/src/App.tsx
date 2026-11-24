import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppRoutes } from './routes/AppRoutes';
import { ToastContainer } from './components/ui';
import { useBrandStore } from './store/useBrandStore';

function App() {
  useEffect(() => {
    useBrandStore.getState().syncPlatformBranding();

    // Re-sync platform branding whenever tab is focused
    const handleFocus = () => {
      useBrandStore.getState().syncPlatformBranding();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
