import React from 'react';
import { CANDORA_BRAND } from '@/lib/candoraBrand';
import { elfFormLink, qrImageUrl } from '@/lib/giftShopElf';
import { giftShopAgeBandLabel, giftShopChildFirstName, giftShopGuardianName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';

export default function GiftShopNameTag({ tag }) {
  return (
    <div className="giftshop-tag relative w-[4in] h-[2.3in] rounded-lg border-2 border-dashed border-slate-400 px-3 py-2 flex items-center gap-2 bg-white overflow-hidden">
      <p data-label-number className="text-6xl font-black leading-none text-slate-900 flex-shrink-0">
        {tag.check_in_sequence}
      </p>
      <div data-label-details className="min-w-0 flex-1 space-y-1 border-l-2 border-slate-300 pl-2.5">
        <p data-label-name className="text-[2rem] font-display font-extrabold leading-none text-slate-900 break-words">
          {giftShopChildFirstName(tag)}
        </p>
        <p data-label-slot className="text-sm font-bold text-slate-900">
          {giftShopSlotLabel(tag.time_slot)}
          {tag.child_age_band ? ` · ${giftShopAgeBandLabel(tag.child_age_band)}` : ''}
        </p>
        {giftShopGuardianName(tag) && (
          <p data-label-guardian className="text-xs font-semibold text-slate-700 break-words">
            Parent/Guardian: {giftShopGuardianName(tag)}
          </p>
        )}
        <p data-label-gifts className="text-sm font-bold text-slate-900">{giftShopTagGifts(tag)}</p>
      </div>
      <div data-label-code className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
        {tag.elf_token && (
          <img data-label-qr src={qrImageUrl(elfFormLink(tag.elf_token))} alt="Scan to help this child" className="h-[0.85in] w-[0.85in]" />
        )}
        <img data-label-logo src={CANDORA_BRAND.logoUrl} alt="Candora" className="h-5 w-5 object-contain" />
        <p data-label-caption className="text-[7px] font-black tracking-[0.15em] text-slate-700">KGS</p>
      </div>
    </div>
  );
}