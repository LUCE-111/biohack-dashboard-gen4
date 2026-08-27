import { useEffect, useState } from 'react';

interface PwaStatus {
  isOnline: boolean;
  updateAvailable: boolean;
  applyUpdate: () => void;
}

export function usePwaStatus(): PwaStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    let disposed = false;

    const watchRegistration = (registration: ServiceWorkerRegistration): void => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) {
          return;
        }

        worker.addEventListener('statechange', () => {
          if (!disposed && worker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(worker);
          }
        });
      });
    };

    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then((registration) => {
        if (!disposed) {
          watchRegistration(registration);
        }
      })
      .catch(() => {
        if (!disposed) {
          setWaitingWorker(null);
        }
      });

    const handleControllerChange = (): void => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return {
    isOnline,
    updateAvailable: waitingWorker !== null,
    applyUpdate: () => {
      waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    },
  };
}
