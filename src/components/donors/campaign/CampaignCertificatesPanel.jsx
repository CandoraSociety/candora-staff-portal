import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// The certificate that goes with a gift made in someone's honour. Its wording
// lives here; each recipient's name, gift and date are filled in on the
// certificate itself when they open it.
export default function CampaignCertificatesPanel({ campaign, onSave }) {
  const [enabled, setEnabled] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(!!campaign?.certificate_enabled);
    setForm({
      certificate_title: campaign?.certificate_title || 'Certificate of Giving',
      certificate_message: campaign?.certificate_message || '',
      certificate_signature: campaign?.certificate_signature || '',
      certificate_signature_title: campaign?.certificate_signature_title || '',
    });
  }, [campaign]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    await onSave({
      certificate_enabled: enabled,
      certificate_title: form.certificate_title || '',
      certificate_message: form.certificate_message || '',
      certificate_signature: form.certificate_signature || '',
      certificate_signature_title: form.certificate_signature_title || '',
    });
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold">Certificates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Give every gift made in someone's honour a personalized certificate, ready to open and
              print from the card they receive.
            </p>
          </div>
          <Badge className={enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
            {enabled ? 'On' : 'Off'}
          </Badge>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Issue a certificate with every gift
        </label>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div>
            <Label>Heading</Label>
            <Input
              value={form.certificate_title || ''}
              onChange={(e) => set('certificate_title', e.target.value)}
              placeholder="Certificate of Giving"
            />
          </div>
          <div>
            <Label>Wording</Label>
            <Textarea
              rows={4}
              value={form.certificate_message || ''}
              onChange={(e) => set('certificate_message', e.target.value)}
              placeholder="Leave blank to use a standard thank-you with the campaign and cause filled in."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Signed by</Label>
              <Input
                value={form.certificate_signature || ''}
                onChange={(e) => set('certificate_signature', e.target.value)}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input
                value={form.certificate_signature_title || ''}
                onChange={(e) => set('certificate_signature_title', e.target.value)}
                placeholder="Executive Director"
              />
            </div>
          </div>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save certificate'}</Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-display font-bold text-sm">Preview</h3>
          <div className="bg-white rounded-xl border-4 border-primary p-5 shadow-sm">
            <div className="border border-border rounded-lg p-5 text-center space-y-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Candora Society</p>
              <p className="font-display font-extrabold text-xl">
                {form.certificate_title || 'Certificate of Giving'}
              </p>
              <p className="text-xs text-muted-foreground">This certificate is presented to</p>
              <p className="font-display font-extrabold text-lg border-b-2 border-primary inline-block px-4 pb-1">
                Jordan Example
              </p>
              <p className="text-sm text-foreground/80 whitespace-pre-line">
                {form.certificate_message ||
                  `A gift has been made in your honour to ${campaign.name}.`}
              </p>
              <p className="font-display font-bold">{form.certificate_signature || 'Candora Society'}</p>
              {form.certificate_signature_title && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {form.certificate_signature_title}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The recipient's name, gift amount, cause and date are filled in on their own certificate.
          </p>
        </div>
      </div>
    </div>
  );
}