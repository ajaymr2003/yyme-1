import React, { useState, useEffect } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { Sliders, Save, CheckCircle, AlertCircle, CreditCard, Building2 } from 'lucide-react';

interface ConfigEntry {
  key: string;
  value: string;
}

const CONFIG_FIELDS = [
  { key: 'upi_id', label: 'UPI ID', placeholder: 'e.g. yymee@upi', icon: CreditCard, section: 'payment' },
  { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. YYME Marketplace Pvt Ltd', icon: Building2, section: 'bank' },
  { key: 'account_holder_name', label: 'Account Holder Name', placeholder: 'e.g. YYME Marketplace Pvt Ltd', icon: Building2, section: 'bank' },
  { key: 'bank_account_number', label: 'Account Number', placeholder: 'Bank account number', icon: Building2, section: 'bank' },
  { key: 'bank_ifsc', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234', icon: Building2, section: 'bank' },
];

export function PlatformConfig() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [initialConfig, setInitialConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);

  useEffect(() => {
    supabase
      .from('platform_config')
      .select('key, value')
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, string> = {};
          (data as ConfigEntry[]).forEach((e) => { map[e.key] = e.value; });
          setConfig(map);
          setInitialConfig(map);
        }
        setLoading(false);
      });
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = CONFIG_FIELDS.map((field) => ({
      key: field.key,
      value: config[field.key] || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('platform_config')
      .upsert(updates, { onConflict: 'key' });

    setSaving(false);

    if (error) {
      showToast('error', 'Failed to save: ' + error.message);
    } else {
      setInitialConfig({ ...config });
      showToast('success', 'Configuration saved successfully');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Platform Config</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage payment and platform settings</p>
      </div>

      {/* Payment Settings */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Payment Settings</h3>
        </div>

        {CONFIG_FIELDS.filter((f) => f.section === 'payment').map((field) => (
          <div key={field.key}>
            <label className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1.5 block">
              {field.label}
            </label>
            <input
              type="text"
              value={config[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-neutral-400"
            />
          </div>
        ))}
      </div>

      {/* Bank Details */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Bank Details</h3>
        </div>

        {CONFIG_FIELDS.filter((f) => f.section === 'bank').map((field) => (
          <div key={field.key}>
            <label className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1.5 block">
              {field.label}
            </label>
            <input
              type="text"
              value={config[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-neutral-400"
            />
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">Seller View Preview</p>
        <p className="text-xs text-amber-700">
          <strong>Payment Details:</strong>{' '}
          UPI ID: {config.upi_id || '—'} | Bank: {config.bank_name || '—'}
        </p>
        {config.account_holder_name && (
          <p className="text-[11px] text-amber-600 mt-1">
            A/C Holder: {config.account_holder_name} | A/C: {config.bank_account_number || '—'} | IFSC: {config.bank_ifsc || '—'}
          </p>
        )}
      </div>

      {isDirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      )}
    </div>
  );
}
