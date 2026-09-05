import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, action, footer, className = '', ...props }) => (
  <div className={`bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden ${className}`} {...props}>
    {(title || action) && (
      <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
        <div>
          {typeof title === 'string' ? <h3 className="text-base font-semibold text-neutral-900">{title}</h3> : title}
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
    {footer && <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">{footer}</div>}
  </div>
);
