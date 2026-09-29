import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  icon,
  iconRight,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#388bfd] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 select-none';

  const sizeClasses = {
    xs: 'h-6 px-2 text-xs gap-1 rounded',
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-9 px-4 text-sm gap-2 rounded-md',
    lg: 'h-10 px-5 text-sm gap-2.5 rounded-md',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm border border-[#2ea043]/30 active:scale-[0.99]',
    secondary:
      'bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] active:bg-[#282e33]',
    ghost:
      'bg-transparent hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]',
    danger:
      'bg-[#da3633]/20 hover:bg-[#da3633]/30 text-[#f85149] border border-[#da3633]/40',
    outline:
      'bg-transparent hover:bg-[#21262d] text-[#f0f6fc] border border-[#30363d]',
    subtle:
      'bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] border border-transparent',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span className="truncate">{children}</span>}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
