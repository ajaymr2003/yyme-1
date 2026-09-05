import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', icon, className = '', disabled, ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200 shadow-sm',
    outline: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 shadow-sm',
    ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {icon && <span className="mr-2 inline-flex">{icon}</span>}
      {children}
    </button>
  );
};
