import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import KioskFrame from '@/components/kiosk/KioskFrame';
import SelfRegisterForm from '@/components/portal/SelfRegisterForm';

// Reuses the same public registration form the QR code uses, so a request
// taken at the kiosk lands in Central Registration exactly like any other.
export default function KioskRegistrationView({ prompt, onRespond, onClose }) {
  const [error, setError] = useState('');
  let program = null;
  try {
    program = prompt.reg_program_json ? JSON.parse(prompt.reg_program_json) : null;
  } catch {
    program = null;
  }

  const handleDone = async () => {
    try {
      await onRespond({ notes: `Registered at the kiosk${prompt.reg_program_name ? ` — ${prompt.reg_program_name}` : ''}` });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not save the registration.');
    }
  };

  return (
    <KioskFrame prompt={prompt} icon={ClipboardCheck} onClose={onClose}>
      {!program ? (
        <p className="text-muted-foreground text-center py-8">
          This registration form is not ready yet. Please ask the reception team for help.
        </p>
      ) : (
        <div className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <SelfRegisterForm program={program} onDone={handleDone} />
        </div>
      )}
    </KioskFrame>
  );
}