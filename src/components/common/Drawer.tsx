import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
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

  const widthClass = {
    md: 'w-[420px]',
    lg: 'w-[520px]',
    xl: 'w-[640px]',
    '2xl': 'w-[780px]',
  }[width];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div
        className={`h-full ${widthClass} max-w-full bg-[#161b22] border-l border-[#30363d] shadow-2xl text-[#f0f6fc] flex flex-col animate-in slide-in-from-right duration-200`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#21262d] bg-[#0d1117]">
          <div>
            <h3 className="text-sm font-semibold text-[#f0f6fc]">{title}</h3>
            {subtitle && <p className="text-xs font-mono text-[#8b949e] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 bg-[#0d1117] border-t border-[#21262d]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
