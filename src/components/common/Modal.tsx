import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className={`w-full ${maxWidthClass} rounded-lg bg-[#161b22] border border-[#30363d] shadow-2xl text-[#f0f6fc] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#21262d]">
          <div>
            <h3 className="text-sm font-semibold text-[#f0f6fc]">{title}</h3>
            {description && <p className="text-xs text-[#8b949e] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh]">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 bg-[#0d1117] border-t border-[#21262d]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
