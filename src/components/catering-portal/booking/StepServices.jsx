import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Minus, Plus } from 'lucide-react';

const inputCls = "w-full border border-cp-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cp-primary/30 bg-white";

export default function StepServices({ data, onChange }) {
  const { data: equipment = [] } = useQuery({
    queryKey: ['rental-equipment'],
    queryFn: () => base44.entities.RentalEquipment.filter({ is_active: true }),
  });
  const { data: serviceOptions = [] } = useQuery({
    queryKey: ['service-options'],
    queryFn: () => base44.entities.ServiceOption.filter({ is_active: true }),
  });

  const staffingRate = serviceOptions.find(s => s.service_key === 'staffing')?.price || 45;

  const getEqQty = (id) => (data.equipment_rentals || []).find(e => e.item_id === id)?.quantity || 0;

  const updateEq = (item, delta) => {
    const curr = data.equipment_rentals || [];
    const existing = curr.find(e => e.item_id === item.id);
    const newQty = (existing?.quantity || 0) + delta;
    let updated;
    if (newQty <= 0) updated = curr.filter(e => e.item_id !== item.id);
    else if (existing) updated = curr.map(e => e.item_id === item.id ? { ...e, quantity: newQty } : e);
    else updated = [...curr, { item_id: item.id, item_name: item.name, quantity: 1, unit_price: item.price_per_unit || 0 }];
    const total = updated.reduce((sum, e) => sum + (e.unit_price * e.quantity), 0);
    onChange({ equipment_rentals: updated, equipment_rental_total: total });
  };

  const SETUP_OPTIONS = [
    ['self_service','Self Service','No setup or teardown by our team','$0'],
    ['setup_only','Setup Only','We set up before your event','$100'],
    ['teardown_only','Teardown Only','We clean up after your event','$100'],
    ['full_setup_teardown','Full Setup & Teardown','Complete service before and after','$200'],
  ];

  const [liquorAck, setLiquorAck] = React.useState(false);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-cp-text mb-2">Additional Services</h2>

      {/* Staffing */}
      <div className="bg-white border border-cp-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" id="staffing" checked={data.staffing_required} onChange={e => onChange({ staffing_required: e.target.checked })} className="w-4 h-4 accent-cp-primary" />
          <label htmlFor="staffing" className="text-sm font-semibold text-gray-700">Add Event Staffing (${staffingRate}/staff member)</label>
        </div>
        {data.staffing_required && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Number of Staff</label>
            <input type="number" className={inputCls} value={data.staffing_count || ''} min={1}
              onChange={e => onChange({ staffing_count: parseInt(e.target.value) || '', staffing_fee: (parseInt(e.target.value) || 0) * staffingRate })}
              placeholder="e.g. 2" />
            {data.staffing_count > 0 && (
              <p className="text-xs text-cp-primary mt-1 font-medium">Staffing total: ${(data.staffing_count * staffingRate).toFixed(2)}</p>
            )}
          </div>
        )}
      </div>

      {/* Setup & Teardown */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Setup & Teardown</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SETUP_OPTIONS.map(([v, l, desc, price]) => (
            <button key={v} onClick={() => onChange({ setup_teardown: v })}
              className={`text-left p-4 rounded-xl border transition-colors ${data.setup_teardown === v ? 'border-cp-primary bg-cp-primary/5' : 'border-cp-border hover:border-cp-primary/50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{l}</span>
                <span className="text-xs text-cp-primary font-bold">{price}</span>
              </div>
              <span className="text-xs text-gray-400">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Rentals */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Equipment Rentals</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {equipment.map(item => {
            const qty = getEqQty(item.id);
            return (
              <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${qty > 0 ? 'border-cp-primary bg-cp-primary/5' : 'border-cp-border bg-white'}`}>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-400">${item.price_per_unit}/unit · {item.quantity_available} avail.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateEq(item, -1)} disabled={qty === 0}
                    className="w-7 h-7 rounded-full border border-cp-border flex items-center justify-center hover:border-cp-primary disabled:opacity-30">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => updateEq(item, 1)} disabled={qty >= item.quantity_available}
                    className="w-7 h-7 rounded-full bg-cp-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-30">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {data.equipment_rental_total > 0 && (
          <p className="text-sm text-cp-primary font-semibold mt-2">Equipment total: ${data.equipment_rental_total.toFixed(2)}</p>
        )}
      </div>

      {/* Liquor Acknowledgment */}
      {data.bar_service_addon && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <input type="checkbox" id="liquor-ack" checked={liquorAck} onChange={e => { setLiquorAck(e.target.checked); onChange({ liquor_acknowledged: e.target.checked }); }} className="w-4 h-4 accent-cp-primary mt-0.5" />
            <label htmlFor="liquor-ack" className="text-sm text-amber-800 leading-relaxed">
              I understand that serving alcohol requires appropriate licensing and permits. I take full responsibility for compliance with all applicable laws and regulations.
            </label>
          </div>
        </div>
      )}
    </div>
  );
}