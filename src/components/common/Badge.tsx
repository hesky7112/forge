import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  dot?: boolean;
  className?: string;
  subtleBox?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  dot = true,
  className = '',
  subtleBox = false,
}) => {
  const dotColors = {
    default: 'bg-[#8b949e]',
    success: 'bg-[#3fb950]',
    warning: 'bg-[#d29922]',
    danger: 'bg-[#f85149]',
    info: 'bg-[#388bfd]',
    purple: 'bg-[#a371f7]',
    neutral: 'bg-[#484f58]',
  }[variant];

  const textColors = {
    default: 'text-[#8b949e]',
    success: 'text-[#3fb950]',
    warning: 'text-[#d29922]',
    danger: 'text-[#f85149]',
    info: 'text-[#58a6ff]',
    purple: 'text-[#a371f7]',
    neutral: 'text-[#8b949e]',
  }[variant];

  if (!subtleBox) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium ${textColors} ${className}`}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
        <span>{children}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2 py-0.5 rounded border border-[#30363d]/60 bg-[#161b22] ${textColors} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      <span>{children}</span>
    </span>
  );
};
