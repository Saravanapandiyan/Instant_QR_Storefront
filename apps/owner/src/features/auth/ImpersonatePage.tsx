import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useActiveStore } from '../../store/useActiveStore';

export function ImpersonatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const restaurantId = params.get('restaurantId');

    if (token) {
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token verification failed');
          return res.json();
        })
        .then((user) => {
          useAuthStore.getState().setAuth({ user, accessToken: token } as any);
          if (restaurantId) {
            useActiveStore.getState().setActiveRestaurantId(restaurantId);
          }
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          navigate('/auth/login', { replace: true });
        });
    } else {
      navigate('/auth/login', { replace: true });
    }
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <div className="text-center">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-sm">Launching Impersonation Session...</p>
        <p className="text-xs text-neutral-400 mt-1">Connecting directly to tenant console</p>
      </div>
    </div>
  );
}
