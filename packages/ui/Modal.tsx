import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full border border-neutral-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
            <button onClick={onClose} className="p-1 text-neutral-400 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-6 py-5">{children}</div>
          {footer && <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50">{footer}</div>}
        </div>
      </div>
    </div>
  );
};
