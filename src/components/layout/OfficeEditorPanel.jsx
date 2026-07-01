import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Table, X, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function OfficeEditorPanel({ open, onClose, docType }) {
  const { toast } = useToast();
  const [fileName, setFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [createdName, setCreatedName] = useState(null);
  const [sharepointUrl, setSharepointUrl] = useState(null);

  const isWord = docType === 'word';
  const Icon = isWord ? FileText : Table;
  const accentColor = isWord ? '#2b579a' : '#217346';
  const label = isWord ? 'Word Document' : 'Excel Workbook';
  const ext = isWord ? '.docx' : '.xlsx';

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await base44.functions.invoke('createOfficeDocument', {
        docType,
        fileName: fileName || `New ${isWord ? 'Document' : 'Workbook'}`
      });
      setEmbedUrl(res.data.embed_url);
      setCreatedName(res.data.file_name);
      setSharepointUrl(res.data.sharepoint_web_url);
      toast({ title: `${label} created!` });
    } catch (err) {
      toast({ title: 'Failed to create document', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setEmbedUrl(null);
    setCreatedName(null);
    setSharepointUrl(null);
    setFileName('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      <div className="relative w-full max-w-[900px] bg-background shadow-2xl flex flex-col h-full ml-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-5 w-5 flex-shrink-0" style={{ color: accentColor }} />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm">{label}</h3>
              {createdName && (
                <p className="text-xs text-muted-foreground truncate">{createdName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {embedUrl && (
              <>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleReset}>
                  New
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(sharepointUrl, '_blank')} title="Open in SharePoint">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!embedUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: accentColor + '15' }}>
              <Icon className="h-8 w-8" style={{ color: accentColor }} />
            </div>
            <h4 className="font-semibold mb-1">New {label}</h4>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Create a blank {label.toLowerCase()} and start editing right here. It saves automatically to SharePoint.
            </p>
            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`Document name (optional)`}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreate()}
                  className="flex-1"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground flex-shrink-0">{ext}</span>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full gap-2"
                size="lg"
                style={{ backgroundColor: accentColor }}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon className="h-4 w-4" />
                    Create {label}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              title={createdName}
              allow="fullscreen"
            />
          </div>
        )}
      </div>
    </div>
  );
}