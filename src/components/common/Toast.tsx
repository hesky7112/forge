import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl text-xs text-[#f0f6fc] animate-in slide-in-from-bottom-2 duration-150"
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 size={16} className="text-[#3fb950]" />}
              {t.type === 'warning' && <AlertTriangle size={16} className="text-[#d29922]" />}
              {t.type === 'error' && <AlertCircle size={16} className="text-[#f85149]" />}
              {t.type === 'info' && <Info size={16} className="text-[#388bfd]" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{t.title}</div>
              {t.description && <div className="text-[#8b949e] mt-0.5">{t.description}</div>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
