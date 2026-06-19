import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck } from 'lucide-react';

// ─── EDIT THE CONFIDENTIALITY AGREEMENT TEXT HERE ───────────────────────────
// You can also replace this entire block by uploading a document in NexusHR → Onboarding Settings.
const NDA_TEXT = `CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

This Confidentiality Agreement ("Agreement") is entered into between the employee named below ("Employee") and Candora ("Organization").

1. CONFIDENTIAL INFORMATION
The Employee agrees to keep strictly confidential all information relating to clients, staff, organizational operations, financial matters, strategic plans, and any other non-public information encountered during the course of employment.

2. CLIENT PRIVACY
The Employee acknowledges that client information is protected under applicable privacy legislation including PIPA (Alberta) and agrees to handle all client data with the utmost care and discretion.

3. SCOPE AND DURATION
This obligation of confidentiality applies during employment and indefinitely following the termination of employment for any reason.

4. DIGITAL SYSTEMS
The Employee agrees not to share login credentials, access systems on behalf of others, or disclose system-specific information to unauthorized parties.

5. CONSEQUENCES OF BREACH
Breach of this Agreement may result in disciplinary action up to and including termination of employment, and may expose the Employee to civil liability.

6. ACKNOWLEDGEMENT
By signing below, the Employee confirms they have read, understood, and agree to be bound by the terms of this Agreement.`;
// ────────────────────────────────────────────────────────────────────────────

export default function NDAGate({ user, employee, onSigned }) {
  const [signedName, setSignedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSign = async () => {
    if (!signedName.trim()) { setError('Please type your full name to sign.'); return; }
    if (!agreed) { setError('You must check the acknowledgement box.'); return; }
    setSaving(true);
    try {
      await base44.entities.NDASignature.create({
        user_id: user.id,
        employee_id: employee?.id || null,
        signed_name: signedName.trim(),
        signed_date: new Date().toISOString(),
      });
      onSigned();
    } catch (e) {
      setError('Something went wrong. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Confidentiality Agreement</h2>
            <p className="text-sm text-gray-500">Required before accessing the Candora Staff Portal</p>
          </div>
        </div>

        {/* Agreement text */}
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{NDA_TEXT}</pre>
        </div>

        {/* Signature section */}
        <div className="p-6 border-t space-y-4 bg-gray-50 rounded-b-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type your full legal name to e-sign
            </label>
            <Input
              value={signedName}
              onChange={e => { setSignedName(e.target.value); setError(''); }}
              placeholder="e.g. Jane Smith"
              className="font-medium"
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="nda-agree"
              checked={agreed}
              onCheckedChange={val => { setAgreed(val); setError(''); }}
            />
            <label htmlFor="nda-agree" className="text-sm text-gray-600 cursor-pointer">
              I have read and understood this Confidentiality Agreement and agree to be legally bound by its terms.
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleSign}
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white"
          >
            {saving ? 'Saving...' : 'Sign & Continue'}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Signed {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}