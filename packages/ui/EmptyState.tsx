import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FolderOpen className="w-10 h-10 text-neutral-400" />,
  title, description, actionLabel, onAction,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-neutral-200 rounded-xl my-4">
    <div className="p-3 bg-neutral-50 rounded-full mb-3 border border-neutral-100">{icon}</div>
    <h3 className="text-base font-bold text-neutral-900 mb-1">{title}</h3>
    <p className="text-xs text-neutral-500 max-w-sm mb-4 leading-relaxed">{description}</p>
    {actionLabel && onAction && <Button onClick={onAction} size="sm">{actionLabel}</Button>}
  </div>
);
