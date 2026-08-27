'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: { message: string; title?: string; type?: ToastType }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, title, type = 'info' }: { message: string; title?: string; type?: ToastType }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  const success = useCallback((message: string, title?: string) => addToast({ message, title, type: 'success' }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ message, title, type: 'error' }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ message, title, type: 'info' }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Floating toast stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5',
              t.type === 'success' && 'bg-emerald-950/90 border-emerald-800 text-emerald-100 dark:bg-emerald-900/90',
              t.type === 'error' && 'bg-destructive border-destructive text-destructive-foreground',
              t.type === 'info' && 'bg-card border-border text-foreground',
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-white mt-0.5" />}
            {t.type === 'info' && <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />}

            <div className="flex-1 text-xs">
              {t.title && <h5 className="font-semibold text-sm mb-0.5">{t.title}</h5>}
              <p className="opacity-90">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
