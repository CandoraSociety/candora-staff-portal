import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UploadAnalyzerDialog({ open, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setStatus('File too large. Maximum 25MB.'); return; }
    setUploading(true);
    setStatus('Uploading...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      setStatus('Upload complete. Ready to analyze.');
      setStep('analyze');
    } catch {
      setStatus('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const handleAnalyze = async () => {
    if (!fileUrl) return;
    setAnalyzing(true);
    setStatus('Analyzing report structure... This may take a minute.');
    try {
      const res = await base44.functions.invoke('analyzeUploadedReport', { file_url: fileUrl });
      if (res.data?.id) {
        navigate(`/reporting/agr/analysis/${res.data.id}`);
      }
    } catch {
      setStatus('Analysis failed. Please try again.');
    }
    setAnalyzing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Analyze Previous AGR</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Upload a PDF of a previous Annual General Report to extract its structure, style, and content checklist.</p>

          {step === 'upload' && (
            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <label className="flex flex-col items-center gap-3 cursor-pointer">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload PDF'}</span>
                <span className="text-xs text-muted-foreground">Max 25MB</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          )}

          {step === 'analyze' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Upload className="w-4 h-4 text-green-600" /></div>
                <p className="text-sm text-green-700">File uploaded successfully</p>
              </div>
              <Button onClick={handleAnalyze} disabled={analyzing} className="w-full gap-2">
                {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><ArrowRight className="w-4 h-4" />Analyze Report</>}
              </Button>
            </div>
          )}

          {status && <p className={`text-xs ${status.includes('fail') || status.includes('large') ? 'text-red-500' : 'text-muted-foreground'}`}>{status}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}