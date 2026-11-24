import React from 'react';
import { CANDORA_BRAND } from '@/lib/candoraBrand';

// Section E: the short answers a supporter looks for before giving. Kept to a
// few expandable lines so the page never turns into a wall of copy.
function Item({ title, children }) {
  return (
    <details className="group border-b py-3 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
        {title}
        <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}

export default function ChristmasInfo({ campaign }) {
  const contact = campaign.contact_email || CANDORA_BRAND.email;
  const receipts =
    campaign.tax_receipt_note ||
    'Candora Society is a registered charity. Tax receipts are issued for eligible gifts.';

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-extrabold">Good to know</h2>
      <div className="rounded-2xl border bg-card px-5 py-1">
        <Item title="About Candora Society">
          Candora Society is a neighbourhood charity in northeast Edmonton. We run programs and
          community spaces for children, families, seniors and newcomers — and this Christmas, every
          gift helps keep that work going.
        </Item>
        <Item title="Charitable tax receipts">{receipts}</Item>
        <Item title="Donation security">
          Gifts are processed securely by Stripe. Your card details are never stored by Candora.
        </Item>
        <Item title="Frequently asked questions">
          <ul className="list-disc space-y-1.5 pl-4">
            <li>You do not need an account to give — guest gifts are welcome.</li>
            <li>Gifts of any size help, and every one is appreciated.</li>
            <li>
              A gift made in someone’s honour can arrive straight away or on the day you choose.
            </li>
            <li>To change something about a gift you have made, contact us and we will help.</li>
          </ul>
        </Item>
        <Item title="Contact us">
          Questions about the campaign? Email{' '}
          <a className="underline" href={`mailto:${contact}`}>
            {contact}
          </a>{' '}
          or visit{' '}
          <a className="underline" href="https://candora.ca" target="_blank" rel="noreferrer">
            candora.ca
          </a>
          .
        </Item>
      </div>
    </section>
  );
}