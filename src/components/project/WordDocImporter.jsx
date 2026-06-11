import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Copy, Check } from 'lucide-react';
import JSZip from 'jszip';

export default function WordDocImporter({ onInsert, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.docx')) return;
    setFileName(file.name);
    setLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const xmlFile = zip.file('word/document.xml');
      if (!xmlFile) throw new Error('Invalid .docx file');
      const xmlStr = await xmlFile.async('string');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'text/xml');
      const paragraphs = doc.getElementsByTagName('w:p');
      let text = '';
      for (let i = 0; i < paragraphs.length; i++) {
        const runs = paragraphs[i].getElementsByTagName('w:t');
        let line = '';
        for (let j = 0; j < runs.length; j++) line += runs[j].textContent;
        if (line.trim()) text += line + '\n\n';
        else text += '\n';
      }
      setContent(text.trim());
    } catch (err) {
      setContent('Error parsing document: ' + err.message);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInsert = () => {
    if (onInsert) onInsert(content);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Import Word Document (.docx)</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          <label className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{fileName || 'Choose a .docx file'}</p>
              <p className="text-xs text-muted-foreground">Click to browse</p>
            </div>
            <input type="file" accept=".docx" onChange={handleFile} className="hidden" />
          </label>
          {loading && <div className="text-sm text-muted-foreground text-center py-4">Parsing document…</div>}
          {content && (
            <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-muted/30">
              <pre className="text-xs whitespace-pre-wrap font-mono">{content}</pre>
            </div>
          )}
        </div>
        <div className="flex justify-between pt-2">
          <div className="flex gap-2">
            {content && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy All</>}
                </Button>
                {onInsert && <Button size="sm" onClick={handleInsert}>Insert into Editor</Button>}
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}