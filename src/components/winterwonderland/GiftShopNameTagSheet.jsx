import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { giftShopChildFirstName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';

// Printable name tag stickers, one per signed-in child: the order number handed
// out at sign-in, the child's first name, their slot and how many gifts (M/F).
export default function GiftShopNameTagSheet({ tags, onClose }) {
  if (!tags?.length) return null;

  const print = () => {
    document.body.classList.add('giftshop-tag-printing');
    window.print();
  };

  const close = () => {
    document.body.classList.remove('giftshop-tag-printing');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/70 overflow-auto p-4">
      <div className="max-w-3xl mx-auto">
        <div className="no-print flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-medium text-white">
            {tags.length === 1 ? 'Name tag ready' : `${tags.length} name tags ready`}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={print}><Printer className="h-3.5 w-3.5" /> Print name tag</Button>
            <Button size="sm" variant="secondary" onClick={close}><X className="h-3.5 w-3.5" /> Done</Button>
          </div>
        </div>

        <div className="giftshop-tag-sheet bg-white rounded-xl p-5">
          <p className="no-print text-xs text-muted-foreground mb-3">Kids Gift Shop — name tag stickers</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="giftshop-tag rounded-lg border-2 border-dashed border-slate-400 p-4 flex items-center gap-4"
              >
                <div className="text-center flex-shrink-0">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Order</p>
                  <p className="text-6xl font-black leading-none text-slate-900">{tag.check_in_sequence}</p>
                </div>
                <div className="min-w-0 border-l border-slate-300 pl-4">
                  <p className="text-2xl font-display font-bold leading-tight text-slate-900 truncate">
                    {giftShopChildFirstName(tag)}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{giftShopSlotLabel(tag.time_slot)}</p>
                  <p className="text-sm text-slate-700">{giftShopTagGifts(tag)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}