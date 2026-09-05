import React from 'react';

export interface TabItem { id: string; label: string; count?: number; }

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`border-b border-neutral-200 flex space-x-6 overflow-x-auto ${className}`}>
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)}
        className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative flex items-center gap-2 ${activeTab === tab.id ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600' : 'text-neutral-500 hover:text-neutral-800'}`}>
        {tab.label}
        {tab.count !== undefined && <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>{tab.count}</span>}
      </button>
    ))}
  </div>
);
