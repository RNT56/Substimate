import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      message,
      type,
      duration,
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    
    return id;
  };

  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        submitting,
        setSubmitting,
      }}
    >
      {children}
      
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`neumorphic-card rounded-lg px-4 py-3 text-sm flex items-center justify-between 
              ${toast.type === 'success' ? 'text-emerald-500' : 
                toast.type === 'error' ? 'text-red-500' : 
                toast.type === 'warning' ? 'text-amber-500' : 
                'text-theme-primary'}`}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => hideToast(toast.id)}
                className="ml-4 text-theme-secondary hover:text-theme-primary transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 