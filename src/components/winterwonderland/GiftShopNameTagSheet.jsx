import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer, X } from 'lucide-react';
import { giftShopAgeBandLabel, giftShopChildFirstName, giftShopGuardianName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';
import { CANDORA_BRAND } from '@/lib/candoraBrand';
import { elfFormLink, newElfToken, qrImageUrl } from '@/lib/giftShopElf';

// Printable name tag stickers, one per signed-in child: the order number handed
// out at sign-in, the child's first name, the parent or guardian with them, their
// slot, how many gifts (M/F), and a QR code an elf scans to open that child's
// form on their phone.
// Shown as a dialog on top of sign-in, so staff can print a family's tags
// without leaving the family they are signing in.
export default function GiftShopNameTagSheet({ tags, onClose }) {
  const open = !!tags?.length;
  const [ready, setReady] = useState(tags || []);

  // Every tag carries its own code, so a volunteer's scan opens that one child.
  // A tag printed before the codes existed is given one on the spot and saved,
  // so the code on the sticker stays valid.
  useEffect(() => {
    const list = tags || [];
    const missing = list.filter(t => !t.elf_token);
    if (!missing.length) {
      setReady(list);
      return;
    }

    let cancelled = false;
    (async () => {
      // A tag printed before already carries a code: reuse the saved one so the
      // sticker the child is wearing still works.
      const stored = await base44.entities.ProgramRegistration
        .filter({ id: { $in: missing.map(t => t.id) } })
        .catch(() => []);
      const byId = new Map((stored || []).map(r => [r.id, r]));
      const stamped = missing.map(t => ({ ...t, elf_token: byId.get(t.id)?.elf_token || newElfToken() }));
      const fresh = stamped.filter(t => !byId.get(t.id)?.elf_token);
      if (cancelled) return;

      setReady(list.map(t => stamped.find(s => s.id === t.id) || t));
      if (fresh.length) {
        await base44.entities.ProgramRegistration
          .bulkUpdate(fresh.map(t => ({ id: t.id, elf_token: t.elf_token })))
          .catch(() => {});
      }
    })();

    return () => { cancelled = true; };
  }, [tags]);

  // Printing waits for the QR codes to finish loading, or they come out blank.
  const printWith = async ({ bodyClass, page, selector }) => {
    await Promise.all(
      Array.from(document.querySelectorAll(selector))
        .map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
    );

    const pageStyle = document.createElement('style');
    pageStyle.textContent = page;
    document.head.appendChild(pageStyle);

    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      pageStyle.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    document.body.classList.add(bodyClass);
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  // Each tag prints on its own DYMO LabelWriter 550 label (4 x 2.3 in), so the
  // page is set to the label size only while the tags are being printed.
  const print = () => printWith({
    bodyClass: 'giftshop-tag-printing',
    page: '@page { size: 4in 2.3in; margin: 0; }',
    selector: '.giftshop-tag-sheet img',
  });

  // For anyone who would rather work from paper than scan the tag: the same
  // codes, one row per child, on a normal letter page.
  const printSheet = () => printWith({
    bodyClass: 'giftshop-elf-printing',
    page: '@page { size: letter; margin: 0.5in; }',
    selector: '.giftshop-elf-sheet img',
  });

  const close = () => {
    document.body.classList.remove('giftshop-tag-printing', 'giftshop-elf-printing');
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent data-giftshop-tag-dialog className="z-[10050] max-w-3xl">
        <DialogTitle className="no-print font-display text-lg">
          {ready.length === 1 ? 'Name tag ready' : `${ready.length} name tags ready`}
        </DialogTitle>

        <div className="no-print flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={print}>
            <Printer className="h-3.5 w-3.5" />
            Print {ready.length === 1 ? 'name tag' : `${ready.length} name tags`}
          </Button>
          <Button size="sm" variant="outline" onClick={printSheet}>
            <FileText className="h-3.5 w-3.5" /> Print QR sheet
          </Button>
          <Button size="sm" variant="secondary" onClick={close}>
            <X className="h-3.5 w-3.5" /> Done
          </Button>
        </div>

        <div className="giftshop-tag-sheet bg-white rounded-xl p-4">
          <p className="no-print text-xs text-muted-foreground mb-3">
            Kids Gift Shop — name tag stickers. Elves scan the QR code, enter their name and the desk PIN to see who the child is buying for.
          </p>
          <div className="giftshop-tag-grid flex flex-wrap gap-3">
            {ready.map(tag => (
              <div
                key={tag.id}
                className="giftshop-tag relative w-[4in] h-[2.3in] rounded-lg border-2 border-dashed border-slate-400 px-3 py-2 flex items-center gap-2 bg-white overflow-hidden"
              >
                <p className="text-6xl font-black leading-none text-slate-900 flex-shrink-0">
                  {tag.check_in_sequence}
                </p>
                <div className="min-w-0 flex-1 space-y-1 border-l-2 border-slate-300 pl-2.5">
                  <p className="text-[2rem] font-display font-extrabold leading-none text-slate-900 break-words">
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
                <div className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                  {tag.elf_token && (
                    <img
                      src={qrImageUrl(elfFormLink(tag.elf_token))}
                      alt="Scan to help this child"
                      className="h-[0.85in] w-[0.85in]"
                    />
                  )}
                  <img src={CANDORA_BRAND.logoUrl} alt="Candora" className="h-5 w-5 object-contain" />
                  <p className="text-[7px] font-black tracking-[0.15em] text-slate-700">KGS</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paper version of the same codes — hidden on screen, laid out as a
            letter-page roster when "Print QR sheet" is used. */}
        <div className="giftshop-elf-sheet">
          <div className="giftshop-elf-head">
            <img src={CANDORA_BRAND.logoUrl} alt="Candora" />
            <div>
              <p className="giftshop-elf-title">Kids Gift Shop — Volunteer QR Codes</p>
              <p className="giftshop-elf-sub">
                {ready.length} {ready.length === 1 ? 'child' : 'children'} signed in · Candora Winter Wonderland
              </p>
            </div>
          </div>

          <div className="giftshop-elf-instructions">
            <p className="giftshop-elf-instructions-title">How to use this sheet</p>
            <ol>
              <li>Scan a child's QR code with your phone camera.</li>
              <li>Enter your name and the desk PIN.</li>
              <li>Write down who the child is buying for, then close the child out when they are returned to their parent or guardian.</li>
            </ol>
          </div>

          <table className="giftshop-elf-table">
            <thead>
              <tr>
                <th className="giftshop-elf-col-order">Order</th>
                <th className="giftshop-elf-col-qr">Code</th>
                <th>Child</th>
                <th className="giftshop-elf-col-time">Time</th>
                <th>Parent / guardian</th>
              </tr>
            </thead>
            <tbody>
              {ready.map(tag => (
                <tr key={tag.id}>
                  <td className="giftshop-elf-col-order">
                    <p className="giftshop-elf-order">{tag.check_in_sequence}</p>
                  </td>
                  <td className="giftshop-elf-col-qr">
                    {tag.elf_token && (
                      <img src={qrImageUrl(elfFormLink(tag.elf_token), 400)} alt={`QR code for ${giftShopChildFirstName(tag)}`} />
                    )}
                  </td>
                  <td>
                    <p className="giftshop-elf-name">{giftShopChildFirstName(tag)}</p>
                    <p className="giftshop-elf-meta">
                      {tag.child_age_band ? `${giftShopAgeBandLabel(tag.child_age_band)} · ` : ''}
                      {giftShopTagGifts(tag)}
                    </p>
                    {tag.elf_token && <p className="giftshop-elf-link">{elfFormLink(tag.elf_token)}</p>}
                  </td>
                  <td className="giftshop-elf-col-time">{giftShopSlotLabel(tag.time_slot)}</td>
                  <td>
                    <p className="giftshop-elf-meta">{giftShopGuardianName(tag) || '—'}</p>
                    {tag.parent_guardian_phone && (
                      <p className="giftshop-elf-meta">{tag.parent_guardian_phone}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}