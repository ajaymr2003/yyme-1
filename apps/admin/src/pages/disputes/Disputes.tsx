import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function Disputes() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">Disputes</h1>
      <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-neutral-500 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <p className="text-sm font-medium">Coming soon</p>
      </div>
    </div>
  );
}
