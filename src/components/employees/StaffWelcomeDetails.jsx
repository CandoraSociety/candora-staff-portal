import { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STAFF_LOGIN_URL, staffWelcomeMessage } from '@/components/employees/staffWelcomeMessage';

export default function StaffWelcomeDetails({ employee, invitationSent, invitationError }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const message = staffWelcomeMessage(employee);
  const copyMessage = async () => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError('Could not copy automatically. Select and copy the message below.');
    }
  };
  return (
    <div className="space-y-3">
      <div className={`rounded-lg border p-3 text-sm ${invitationSent === false ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-muted/40 text-foreground border-border'}`} role={invitationSent === false ? 'alert' : undefined}>
        {invitationSent === true ? 'Employee saved and app invitation sent. They must still complete their first sign-in.' : invitationSent === false ? 'Employee saved, but the app invitation was not sent. An administrator must invite this email from App Users before they can sign in.' : 'Confirm access in App Users before sending this message. An employee profile alone does not grant sign-in access.'}
        {invitationError && <p className="mt-2 text-xs">{invitationError}</p>}
      </div>
      <p className="text-sm text-muted-foreground">Send this to <strong>{employee.email}</strong>.</p>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={copyMessage} className="h-7 text-xs gap-1">
          {copied ? <><CheckCheck className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy Message</>}
        </Button>
      </div>
      {copyError && <p role="alert" className="text-sm text-destructive">{copyError}</p>}
      <textarea aria-label="Staff welcome message" readOnly value={message} className="w-full h-64 text-xs font-mono bg-muted/40 border rounded-md p-3 resize-none" />
      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs space-y-1">
        <strong>Staff login, after invitation:</strong>
        <a href={STAFF_LOGIN_URL} target="_blank" rel="noopener noreferrer" className="block break-all text-accent underline">{STAFF_LOGIN_URL}</a>
        <p>Use the invited email. Microsoft sign-in or Create one for email/password.</p>
      </div>
    </div>
  );
}