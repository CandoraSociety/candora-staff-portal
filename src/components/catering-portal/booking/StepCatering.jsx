import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Minus, Plus } from 'lucide-react';

const CATEGORIES = ['appetizers','entrees','sides','desserts','beverages','platters'];
const inputCls = "w-full border border-cp-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cp-primary/30 bg-white";

export default function StepCatering({ data, onChange }) {
  const { data: menuItems = [] } = useQuery({
    queryKey: ['catering-menu-items'],
    queryFn: () => base44.entities.CateringMenuItem.filter({ is_active: true }),
  });

  const guestCount = parseInt(data.guest_count) || 0;
  const platedDisabled = guestCount > 50;

  const filteredItems = data.catering_style
    ? menuItems.filter(m => m.style === data.catering_style)
    : menuItems;

  const getQty = (id) => (data.catering_selections || []).find(s => s.item_id === id)?.quantity || 0;

  const updateQty = (item, delta) => {
    const curr = data.catering_selections || [];
    const existing = curr.find(s => s.item_id === item.id);
    const newQty = (existing?.quantity || 0) + delta;
    let updated;
    if (newQty <= 0) updated = curr.filter(s => s.item_id !== item.id);
    else if (existing) updated = curr.map(s => s.item_id === item.id ? { ...s, quantity: newQty } : s);
    else updated = [...curr, { item_id: item.id, item_name: item.name, category: item.category, quantity: 1, unit_price: item.price_per_person || item.price_per_unit || 0 }];

    const estimate = updated.reduce((sum, s) => {
      const priceItem = menuItems.find(m => m.id === s.item_id);
      const price = priceItem?.price_per_person ? priceItem.price_per_person * guestCount : (priceItem?.price_per_unit || 0) * s.quantity;
      return sum + price;
    }, 0);
    onChange({ catering_selections: updated, catering_estimate: estimate, catering_gratuity: estimate * 0.15 });
  };

  const barFee = data.bar_service_addon
    ? 150 + (data.bar_liquor_source === 'we_provide' ? (parseFloat(data.bar_estimated_sales) || 0) * 0.15 : 0)
    : 0;

  const LIQUOR_OPTIONS = ['Beer', 'Wine', 'Spirits', 'Cocktails'];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-cp-text mb-2">Catering & Bar</h2>

      {/* Catering Required */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Do you require catering?</p>
        <div className="flex flex-wrap gap-3">
          {[['yes','Yes, please!'],['no','No catering needed'],['skip_for_now','Decide Later']].map(([v,l]) => (
            <button key={v} onClick={() => onChange({ catering_required: v })}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${data.catering_required === v ? 'bg-cp-primary text-white border-cp-primary' : 'border-cp-border text-gray-500 hover:border-cp-primary'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {data.catering_required === 'yes' && (
        <>
          {/* Style */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Catering Style</p>
            <div className="flex gap-3 flex-wrap">
              {[['buffet','Buffet'],['plated','Plated Service']].map(([v,l]) => (
                <button key={v} onClick={() => !platedDisabled || v !== 'plated' ? onChange({ catering_style: v }) : null}
                  disabled={platedDisabled && v === 'plated'}
                  title={platedDisabled && v === 'plated' ? 'Plated service only available for groups of 50 or fewer' : ''}
                  className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${data.catering_style === v ? 'bg-cp-primary text-white border-cp-primary' : 'border-cp-border text-gray-500 hover:border-cp-primary'} disabled:opacity-40 disabled:cursor-not-allowed`}>
                  {l} {platedDisabled && v === 'plated' && '(50 guests max)'}
                </button>
              ))}
            </div>
          </div>

          {/* Service Level */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Service Level</p>
            <div className="space-y-2">
              {[
                ['full_service','Full Service','Table-side delivery, bussing, water refills'],
                ['light_service','Light Service','Food set up by our team, you manage the rest'],
                ['drop_off_only','Drop-Off Only','Food delivered — no staff, self-managed'],
              ].map(([v,l,desc]) => (
                <button key={v} onClick={() => onChange({ catering_service_level: v })}
                  className={`w-full text-left px-5 py-3 rounded-xl border transition-colors ${data.catering_service_level === v ? 'border-cp-primary bg-cp-primary/5' : 'border-cp-border hover:border-cp-primary/50'}`}>
                  <span className="font-semibold text-sm">{l}</span>
                  <span className="text-xs text-gray-400 ml-2">— {desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Selection */}
          {data.catering_style && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Select Menu Items</p>
              {CATEGORIES.map(cat => {
                const catItems = filteredItems.filter(m => m.category === cat);
                if (!catItems.length) return null;
                return (
                  <div key={cat} className="mb-5">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 capitalize">{cat}</h4>
                    <div className="space-y-2">
                      {catItems.map(item => {
                        const qty = getQty(item.id);
                        const price = item.price_per_person ? `$${item.price_per_person}/person` : `$${item.price_per_unit}/unit`;
                        return (
                          <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${qty > 0 ? 'border-cp-primary bg-cp-primary/5' : 'border-cp-border bg-white'}`}>
                            <div className="flex-1">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQty(item, -1)} disabled={qty === 0}
                                className="w-7 h-7 rounded-full border border-cp-border flex items-center justify-center hover:border-cp-primary disabled:opacity-30">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                              <button onClick={() => updateQty(item, 1)}
                                className="w-7 h-7 rounded-full border border-cp-primary bg-cp-primary text-white flex items-center justify-center hover:opacity-90">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Request */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Requests / Dietary Notes</label>
            <textarea rows={2} className={inputCls} value={data.catering_custom_request || ''} onChange={e => onChange({ catering_custom_request: e.target.value })} placeholder="Any special dietary needs, allergies, or custom menu requests..." />
          </div>

          {/* Bar Service */}
          <div className="bg-cp-muted rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" id="bar" checked={data.bar_service_addon} onChange={e => onChange({ bar_service_addon: e.target.checked })} className="w-4 h-4 accent-cp-primary" />
              <label htmlFor="bar" className="text-sm font-semibold text-gray-700">Add Bar Service (+$150 staffing fee)</label>
            </div>
            {data.bar_service_addon && (
              <div className="space-y-4 pl-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Bar Type</p>
                  <div className="flex gap-3">
                    {[['open_bar','Open Bar'],['cash_bar','Cash Bar']].map(([v,l]) => (
                      <button key={v} onClick={() => onChange({ bar_service_type: v })}
                        className={`px-4 py-1.5 rounded-full text-sm border ${data.bar_service_type === v ? 'bg-cp-primary text-white border-cp-primary' : 'border-cp-border text-gray-500'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Who Provides Liquor?</p>
                  <div className="flex gap-3">
                    {[['we_provide','Candora Provides'],['client_provides','Client Provides']].map(([v,l]) => (
                      <button key={v} onClick={() => onChange({ bar_liquor_source: v })}
                        className={`px-4 py-1.5 rounded-full text-sm border ${data.bar_liquor_source === v ? 'bg-cp-primary text-white border-cp-primary' : 'border-cp-border text-gray-500'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                {data.bar_liquor_source === 'we_provide' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Liquor Selections</p>
                      <div className="flex flex-wrap gap-2">
                        {LIQUOR_OPTIONS.map(opt => {
                          const selected = (data.bar_liquor_selections || []).includes(opt);
                          return (
                            <button key={opt} onClick={() => onChange({ bar_liquor_selections: selected ? data.bar_liquor_selections.filter(x => x !== opt) : [...(data.bar_liquor_selections || []), opt] })}
                              className={`px-3 py-1 rounded-full text-xs border ${selected ? 'bg-cp-primary text-white border-cp-primary' : 'border-cp-border text-gray-500'}`}>{opt}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Estimated Bar Sales ($)</label>
                      <input type="number" className={inputCls} value={data.bar_estimated_sales || ''} onChange={e => onChange({ bar_estimated_sales: e.target.value })} placeholder="0.00" />
                    </div>
                  </>
                )}
                <div className="bg-white rounded-lg p-3 text-sm space-y-1 border border-cp-border">
                  <p className="font-semibold text-gray-700">Bar Fee Breakdown</p>
                  <p className="text-gray-500">Staffing fee: <span className="text-gray-700 font-medium">$150.00</span></p>
                  {data.bar_liquor_source === 'we_provide' && parseFloat(data.bar_estimated_sales) > 0 && (
                    <p className="text-gray-500">15% of estimated sales: <span className="text-gray-700 font-medium">${(parseFloat(data.bar_estimated_sales) * 0.15).toFixed(2)}</span></p>
                  )}
                  <p className="font-bold text-cp-primary">Total Bar Fee: ${barFee.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Subtotal */}
          {(data.catering_estimate > 0) && (
            <div className="bg-cp-primary/5 border border-cp-primary/20 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between"><span>Catering Subtotal:</span><span className="font-semibold">${(data.catering_estimate || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Gratuity (15%):</span><span className="font-semibold">${(data.catering_gratuity || 0).toFixed(2)}</span></div>
              {data.bar_service_addon && <div className="flex justify-between"><span>Bar Service:</span><span className="font-semibold">${barFee.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-cp-primary border-t border-cp-primary/20 pt-1 mt-1">
                <span>Section Total:</span><span>${((data.catering_estimate || 0) + (data.catering_gratuity || 0) + barFee).toFixed(2)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}