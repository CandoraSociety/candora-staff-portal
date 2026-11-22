import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer, X } from 'lucide-react';
import { giftShopAgeBandLabel, giftShopChildFullName, giftShopGiftRows, giftShopGuardianName, giftShopSlotLabel } from '@/lib/giftShopFamilies';
import GiftShopNameTag from '@/components/winterwonderland/GiftShopNameTag';
import printGiftShopLabels from '@/lib/printGiftShopLabels';
import printDymoTags, { findDymoPrinter } from '@/lib/dymoPrint';
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
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState('');
  const [dymo, setDymo] = useState(null);
  const gridRef = useRef(null);

  // When DYMO Connect is running, tags go straight to the label printer at the
  // label's own size. Detection happens on open, so Print stays a single click.
  useEffect(() => {
    let alive = true;
    findDymoPrinter().then(target => { if (alive) setDymo(target); });
    return () => { alive = false; };
  }, []);

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

  // Use a clean roll-oriented print document instead of printing the dialog.
  const print = async () => {
    setPrinting(true);
    setPrintError('');
    try {
      if (dymo) await printDymoTags(ready, dymo);
      else await printGiftShopLabels(gridRef.current);
    } catch (error) {
      setPrintError(`Could not print the name tags: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

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
          <Button size="sm" onClick={print} disabled={printing || ready.some(tag => !tag.elf_token)} aria-busy={printing}>
            <Printer className="h-3.5 w-3.5" />
            {printing ? 'Preparing print…' : `Print ${ready.length === 1 ? 'name tag' : `${ready.length} name tags`}`}
          </Button>
          <Button size="sm" variant="outline" onClick={printSheet}>
            <FileText className="h-3.5 w-3.5" /> Print paper forms
          </Button>
          <Button size="sm" variant="secondary" onClick={close}>
            <X className="h-3.5 w-3.5" /> Done
          </Button>
        </div>

        {printError && <p role="alert" className="no-print text-sm text-destructive">{printError}</p>}

        <div className="giftshop-tag-sheet bg-white rounded-xl p-4">
          <p className="no-print text-xs text-muted-foreground mb-3">
            Kids Gift Shop — name tag stickers. Elves scan the QR code, enter their name and the desk PIN to see who the child is buying for.
          </p>
          <p className="no-print text-xs text-muted-foreground mb-3">
            {dymo
              ? `Printing straight to ${dymo.printer} at the label's own 2.3 × 4 in size — no print dialog.`
              : 'DYMO Connect is not running, so a print window opens instead: choose the loaded 2.3 × 4 in label, Margins None and Scale 100%.'}
          </p>
          <div ref={gridRef} className="giftshop-tag-grid flex flex-wrap gap-3">
            {ready.map(tag => <GiftShopNameTag key={tag.id} tag={tag} />)}
          </div>
        </div>

        {/* Paper version of the volunteer's form — hidden on screen, printed as
            one letter-page form per child for elves who would rather work by hand. */}
        <div className="giftshop-elf-sheet">
          <div className="giftshop-elf-head">
            <img src={CANDORA_BRAND.logoUrl} alt="Candora" />
            <div>
              <p className="giftshop-elf-title">Kids Gift Shop — Elf paper forms</p>
              <p className="giftshop-elf-sub">
                {ready.length} {ready.length === 1 ? 'child' : 'children'} · One form per child · Candora Winter Wonderland
              </p>
            </div>
          </div>

          <div className="giftshop-elf-instructions">
            <p className="giftshop-elf-instructions-title">How to fill in this form</p>
            <ol>
              <li>Write what the child picked on the line under each gift.</li>
              <li>Tick the box when the child is returned to their parent or guardian.</li>
              <li>Write your name, then hand the form to the registration desk.</li>
            </ol>
            <p className="giftshop-elf-note">
              The QR code opens the same form on a phone, for anyone who would rather tap than write.
            </p>
          </div>

          <div className="giftshop-elf-forms">
            {ready.map(tag => (
              <div key={tag.id} className="giftshop-elf-form">
                <div className="giftshop-elf-form-top">
                  <div className="giftshop-elf-order-box">{tag.check_in_sequence || '–'}</div>
                  <div className="giftshop-elf-ident">
                    <p className="giftshop-elf-name">{giftShopChildFullName(tag)}</p>
                    <p className="giftshop-elf-meta">
                      {[
                        tag.child_age_band ? giftShopAgeBandLabel(tag.child_age_band) : '',
                        giftShopSlotLabel(tag.time_slot),
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {tag.elf_token && (
                    <img
                      className="giftshop-elf-qr"
                      src={qrImageUrl(elfFormLink(tag.elf_token), 400)}
                      alt={`QR code for ${giftShopChildFullName(tag)}`}
                    />
                  )}
                </div>

                <div className="giftshop-elf-guardian">
                  <span className="giftshop-elf-label">Parent / guardian</span>
                  <p className="giftshop-elf-guardian-name">{giftShopGuardianName(tag) || 'Not recorded'}</p>
                  {(tag.parent_guardian_phone || tag.parent_guardian_email) && (
                    <p className="giftshop-elf-meta">
                      {[tag.parent_guardian_phone, tag.parent_guardian_email].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="giftshop-elf-gifts">
                  <span className="giftshop-elf-label">What did they pick?</span>
                  {giftShopGiftRows(tag).map(gift => (
                    <div key={gift.index} className="giftshop-elf-gift">
                      <p className="giftshop-elf-gift-who">
                        Gift {gift.index} — For {gift.who}{gift.gender ? ` (${gift.gender})` : ''}
                      </p>
                      <div className="giftshop-elf-write-line" />
                    </div>
                  ))}
                </div>

                <div className="giftshop-elf-signoff">
                  <p className="giftshop-elf-return">
                    <span className="giftshop-elf-box" />Returned to parent / guardian
                  </p>
                  <p className="giftshop-elf-elfname">
                    Elf name <span className="giftshop-elf-sign-line" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}