import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  shortcut?: string;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, shortcut, onClear, className = '', value, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-2.5 text-[#8b949e] pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          value={value}
          className={`h-8 w-full rounded-md bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#484f58] transition-colors focus:border-[#388bfd] focus:outline-none focus:ring-1 focus:ring-[#388bfd] ${
            icon ? 'pl-8' : 'pl-3'
          } ${shortcut || (onClear && value) ? 'pr-12' : 'pr-3'} ${className}`}
          {...props}
        />
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 text-[#8b949e] hover:text-[#f0f6fc] text-xs px-1"
          >
            ✕
          </button>
        )}
        {shortcut && !(onClear && value) && (
          <span className="absolute right-2 text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d] pointer-events-none">
            {shortcut}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
