// yss_orbit\frontend\src\modules\welcome\hooks\useToast.ts
import { useState, useCallback, useRef } from 'react';

let _globalDispatch: any = null;

export function _registerDispatch(fn: any) {
  _globalDispatch = fn;
}

export function showToast(toast: any) {
  if (_globalDispatch) {
    _globalDispatch(toast);
  }
}

let _idCounter = 0;

export function useToastState() {
  const [toasts, setToasts] = useState<any[]>([]);
  const timersRef = useRef<Record<number, any>>({});

  const dispatch = useCallback((toast: any) => {
    const id = ++_idCounter;
    const duration = toast.duration ?? 5000;

    setToasts(prev => [...prev, { ...toast, id }]);

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        delete timersRef.current[id];
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  _registerDispatch(dispatch);

  return { toasts, dismiss };
}

export function useToast() {
  const dispatch = useCallback((toast: any) => {
    showToast(toast);
  }, []);

  return { showToast: dispatch };
}
