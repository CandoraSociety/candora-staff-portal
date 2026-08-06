import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, Save, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildCrtComments } from '@/lib/crtComments';
import { toast } from 'sonner';

export default function CrtAdditionalComments({ client, onClientUpdate }) {
  const [value, setValue] = useState(client?.crt_additional_comments || '');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setValue(client?.crt_additional_comments || '');
  }, [client?.id, client?.crt_additional_comments]);

  const preview = useMemo(() => buildCrtComments({ ...client, crt_additional_comments: value }), [client, value]);
  const dirty = (value || '') !== (client?.crt_additional_comments || '');

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Client.update(client.id, { crt_additional_comments: value.trim() });
      onClientUpdate?.(updated);
      toast.success('Additional CRT comment saved — will appear in Column S on the next sync.');
    } catch (e) {
      toast.error('Failed to save comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-primary" />
          Additional CRT Comments (Column S)
        </CardTitle>
        <p className="text-xs text-slate-500">
          Anything entered here is appended to the Comments (Column S) cell in the CRT alongside the
          auto-generated notes (intake, resolved barriers, EDA completions, employment, 90-day follow-up).
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add an extra comment for the CRT Comments (S) field…"
          className="text-sm"
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-500 h-7"
            onClick={() => setShowPreview((p) => !p)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            {showPreview ? 'Hide' : 'Preview'} full Column S
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="h-7 text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? 'Saving…' : 'Save Comment'}
          </Button>
        </div>
        {showPreview && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Column S preview
            </p>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {preview || '(empty)'}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}