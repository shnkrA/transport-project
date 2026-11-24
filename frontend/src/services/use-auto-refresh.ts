import { useEffect } from 'react';

export function useAutoRefresh(refresh: () => unknown, intervalMs = 10000) {
  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = window.setInterval(refreshWhenVisible, intervalMs);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [refresh, intervalMs]);
}
