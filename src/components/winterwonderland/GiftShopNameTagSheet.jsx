import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { giftShopAgeBandLabel, giftShopChildFirstName, giftShopGuardianName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';
import { CANDORA_BRAND } from '@/lib/candoraBrand';

// Printable name tag stickers, one per signed-in child: the order number handed
// out at sign-in, the child's first name, the parent or guardian with them, their
// slot and how many gifts (M/F).
// Shown as a dialog on top of sign-in, so staff can print a family's tags
// without leaving the family they are signing in.
export default function GiftShopNameTagSheet({ tags, onClose }) {
  const open = !!tags?.length;

  // Each tag prints on its own DYMO LabelWriter 550 label (2.3 x 4 in), so the
  // page is set to the label size only while this sheet is being printed.
  const print = () => {
    const pageStyle = document.createElement('style');
    pageStyle.textContent = '@page { size: 4in 2.3in; margin: 0; }';
    document.head.appendChild(pageStyle);

    const cleanup = () => {
      document.body.classList.remove('giftshop-tag-printing');
      pageStyle.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    document.body.classList.add('giftshop-tag-printing');
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const close = () => {
    document.body.classList.remove('giftshop-tag-printing');
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent data-giftshop-tag-dialog className="z-[10050] max-w-3xl">
        <DialogTitle className="no-print font-display text-lg">
          {tags.length === 1 ? 'Name tag ready' : `${tags.length} name tags ready`}
        </DialogTitle>

        <div className="no-print flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={print}>
            <Printer className="h-3.5 w-3.5" />
            Print {tags.length === 1 ? 'name tag' : `${tags.length} name tags`}
          </Button>
          <Button size="sm" variant="secondary" onClick={close}>
            <X className="h-3.5 w-3.5" /> Done
          </Button>
        </div>

        <div className="giftshop-tag-sheet bg-white rounded-xl p-4">
          <p className="no-print text-xs text-muted-foreground mb-3">Kids Gift Shop — name tag stickers</p>
          <div className="giftshop-tag-grid flex flex-wrap gap-3">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="giftshop-tag relative w-[4in] h-[2.3in] rounded-lg border-2 border-dashed border-slate-400 px-3 py-2 flex items-center gap-3 bg-white overflow-hidden"
              >
                <div className="absolute right-2 top-2 text-center">
                  <img src={CANDORA_BRAND.logoUrl} alt="Candora" className="h-9 w-9 object-contain mx-auto" />
                  <p className="text-[9px] font-black tracking-[0.15em] text-slate-700">KGS</p>
                </div>
                <div className="text-center flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Order</p>
                  <p className="text-6xl font-black leading-none text-slate-900">{tag.check_in_sequence}</p>
                </div>
                <div className="min-w-0 flex-1 space-y-1 border-l-2 border-slate-300 pl-3 pr-10">
                  <p className="text-4xl font-display font-extrabold leading-none text-slate-900 break-words">
                    {giftShopChildFirstName(tag)}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {giftShopSlotLabel(tag.time_slot)}
                    {tag.child_age_band ? ` · ${giftShopAgeBandLabel(tag.child_age_band)}` : ''}
                  </p>
                  {giftShopGuardianName(tag) && (
                    <p className="text-xs font-semibold text-slate-700 break-words">
                      Parent/Guardian: {giftShopGuardianName(tag)}
                    </p>
                  )}
                  <p className="text-sm font-bold text-slate-900">{giftShopTagGifts(tag)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}