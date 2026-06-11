import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Copy, Check } from 'lucide-react';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
      <button onClick={handleCopy} className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors" title="Copy">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function GrantsOrgQuickReference({ orgInfo }) {
  if (!orgInfo) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Org Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No org info yet.</p>
          <Link to="/grants/org-info" className="block text-xs text-primary hover:underline text-center">Set up org info →</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-accent" />
          Org Quick Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <CopyField label="Legal Name" value={orgInfo.legal_name || orgInfo.org_name} />
        <CopyField label="Charitable Number" value={orgInfo.charitable_number} />
        <CopyField label="Registration Number" value={orgInfo.registration_number} />
        <CopyField label="GST Number" value={orgInfo.gst_number} />
        <CopyField label="Fiscal Year End" value={orgInfo.fiscal_year_end} />
        <CopyField label="Executive Director" value={orgInfo.executive_director_name} />
      </CardContent>
    </Card>
  );
}