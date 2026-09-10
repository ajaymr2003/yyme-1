import React from 'react';
import { Store, ShieldCheck, Truck } from 'lucide-react';

const ITEMS = [
  {
    title: 'Support Local Sellers',
    description: 'Margin goes directly to local weavers and food growers.',
    icon: Store,
  },
  {
    title: 'Verified Vendors',
    description: 'Government GST and Cooperative enrolment ID checks.',
    icon: ShieldCheck,
  },
  {
    title: 'Direct courier delivery',
    description: 'Securely dispatched from seller units to your doorstep.',
    icon: Truck,
  },
];

export function WhyChooseUs() {
  return (
    <section className="w-full py-6 border-b border-neutral-200">
      <h2 className="text-base font-extrabold mb-3 text-neutral-900">Why Choose Us</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ITEMS.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <div key={idx} className="p-3 rounded-xl border border-neutral-200 bg-white flex gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-lg shrink-0">
                <ItemIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">{item.title}</h4>
                <p className="text-[10px] text-neutral-500">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
