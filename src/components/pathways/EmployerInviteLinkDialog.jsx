import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployerInviteLinkDialog({ employer, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/employer-portal/register?employer=${employer.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed — select the link and copy manually');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Employer registration link</DialogTitle></DialogHeader>
        <p className="text-sm text-slate-600">
          Share this link with <span className="font-medium">{employer.contact_name || employer.name}</span> at{' '}
          <span className="font-medium">{employer.contact_email}</span>. They'll open it, review their company
          details, and set their own portal password — no staff account or staff-portal email is created.
        </p>
        <Input readOnly value={link} className="text-sm font-mono" onFocus={(e) => e.target.select()} />
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={copy}>
            {copied ? <><Check className="w-4 h-4 mr-2" /> Copied</> : <><Copy className="w-4 h-4 mr-2" /> Copy link</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}