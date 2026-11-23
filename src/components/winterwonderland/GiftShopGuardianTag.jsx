import React from 'react';
import { CANDORA_BRAND } from '@/lib/candoraBrand';
import { giftShopFamilyChildNames, giftShopSlotLabel } from '@/lib/giftShopFamilies';

// The parent or guardian's own name tag: their name, their shopping slot, and
// every child they are at the shop with — so a volunteer can see at a glance
// which family an adult belongs to.
export default function GiftShopGuardianTag({ family }) {
  const children = giftShopFamilyChildNames(family);

  return (
    <div className="giftshop-tag relative w-[4in] h-[2.3in] rounded-lg border-2 border-dashed border-slate-400 px-3 py-2 flex items-center gap-2 bg-white overflow-hidden">
      <p
        data-label-badge
        className="flex-shrink-0 rounded border-2 border-slate-900 px-1.5 py-1 text-[10px] font-black leading-tight tracking-[0.05em] text-slate-900"
      >
        Parent/Guardian
      </p>
      <div data-label-details className="min-w-0 flex-1 space-y-1 border-l-2 border-slate-300 pl-2.5">
        <p data-label-name className="text-[2rem] font-display font-extrabold leading-none text-slate-900 break-words">
          {family.guardian_name || 'Parent / Guardian'}
        </p>
        <p data-label-slot className="text-sm font-bold text-slate-900">
          {giftShopSlotLabel(family.time_slot)}
        </p>
        {children.length > 0 && (
          <p data-label-kids className="text-xs font-bold text-slate-900 break-words">
            Shopper's name: {children.join(' · ')}
          </p>
        )}
      </div>
      <div data-label-code className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
        <img data-label-logo src={CANDORA_BRAND.logoUrl} alt="Candora" className="h-[30px] w-[30px] object-contain" />
        <p data-label-caption className="text-[11px] font-black leading-none tracking-[0.1em] text-slate-700">KGS</p>
      </div>
    </div>
  );
}