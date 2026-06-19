import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, FileText, Video, PenLine, ClipboardList, ChevronRight, ChevronLeft, X } from 'lucide-react';

const TYPE_ICONS = {
  acknowledge: ClipboardList,
  'e-sign': PenLine,
  'fill-out-form': FileText,
  'watch-video': Video,
};

const TYPE_LABELS = {
  acknowledge: 'Read & Acknowledge',
  'e-sign': 'E-Sign',
  'fill-out-form': 'Fill Out Form',
  'watch-video': 'Watch Video',
};

function StepView({ template, record, onComplete, onSkip }) {
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [saving, setSaving] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  const isCompleted = record?.status === 'completed';
  const Icon = TYPE_ICONS[template.completion_type] || FileText;

  const handleComplete = async () => {
    setSaving(true);
    const data = {
      status: 'completed',
      completed_date: new Date().toISOString(),
      ...(template.completion_type === 'e-sign' ? { signed_name: signedName.trim() } : {}),
    };
    if (record?.id) {
      await base44.entities.OnboardingRecord.update(record.id, data);
    }
    onComplete();
    setSaving(false);
  };

  const canComplete = () => {
    if (isCompleted) return false;
    if (template.completion_type === 'acknowledge') return agreed;
    if (template.completion_type === 'e-sign') return agreed && signedName.trim().length > 0;
    if (template.completion_type === 'watch-video') return videoWatched;
    return true; // fill-out-form — just let them proceed
  };

  return (
    <div className="space-y-5">
      {/* Document viewer */}
      {template.file_url && (
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          {template.completion_type === 'watch-video' ? (
            <video
              controls
              src={template.file_url}
              className="w-full max-h-64"
              onEnded={() => setVideoWatched(true)}
            />
          ) : (
            <div className="p-4 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 truncate">{template.title}</p>
                <a
                  href={template.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Open document ↗
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {template.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Completed
        </div>
      )}

      {!isCompleted && (
        <div className="space-y-3 pt-2 border-t">
          {template.completion_type === 'e-sign' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type your full name to e-sign</label>
              <Input value={signedName} onChange={e => setSignedName(e.target.value)} placeholder="Full legal name" />
            </div>
          )}

          {(template.completion_type === 'acknowledge' || template.completion_type === 'e-sign') && (
            <div className="flex items-start gap-3">
              <Checkbox id={`agree-${template.id}`} checked={agreed} onCheckedChange={setAgreed} />
              <label htmlFor={`agree-${template.id}`} className="text-sm text-gray-600 cursor-pointer">
                I confirm I have {template.completion_type === 'watch-video' ? 'watched' : 'read and understood'} this document and agree to its terms.
              </label>
            </div>
          )}

          {template.completion_type === 'watch-video' && !videoWatched && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">Please watch the video to completion to proceed.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OnboardingWizard({ user, employee, templates, records, onComplete, onDismiss }) {
  const [step, setStep] = useState(0);
  const [localRecords, setLocalRecords] = useState(records || []);
  const [saving, setSaving] = useState(false);

  const pendingTemplates = templates.filter(t => {
    const rec = localRecords.find(r => r.template_id === t.id);
    return !rec || rec.status !== 'completed';
  });

  const allTemplates = templates; // show all, highlight incomplete
  const current = allTemplates[step];
  const currentRecord = localRecords.find(r => r.template_id === current?.id);
  const totalRequired = templates.filter(t => t.is_required).length;
  const completedRequired = templates.filter(t => t.is_required && localRecords.find(r => r.template_id === t.id && r.status === 'completed')).length;
  const allRequiredDone = completedRequired >= totalRequired;

  const handleStepComplete = async () => {
    setSaving(true);
    const data = {
      user_id: user.id,
      employee_id: employee?.id || null,
      template_id: current.id,
      status: 'completed',
      completed_date: new Date().toISOString(),
    };
    let updated;
    if (currentRecord?.id) {
      updated = await base44.entities.OnboardingRecord.update(currentRecord.id, data);
    } else {
      updated = await base44.entities.OnboardingRecord.create(data);
    }
    setLocalRecords(prev => {
      const filtered = prev.filter(r => r.template_id !== current.id);
      return [...filtered, updated];
    });
    setSaving(false);
    if (step < allTemplates.length - 1) setStep(s => s + 1);
    else if (allRequiredDone) onComplete();
  };

  const handleSkip = async () => {
    if (current.is_required) return;
    setSaving(true);
    const data = {
      user_id: user.id,
      employee_id: employee?.id || null,
      template_id: current.id,
      status: 'skipped',
    };
    if (currentRecord?.id) {
      await base44.entities.OnboardingRecord.update(currentRecord.id, data);
    } else {
      await base44.entities.OnboardingRecord.create(data);
    }
    setSaving(false);
    if (step < allTemplates.length - 1) setStep(s => s + 1);
  };

  if (!current) return null;

  const Icon = TYPE_ICONS[current.completion_type] || FileText;

  return (
    <div className="fixed inset-0 z-40 bg-gray-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Staff Onboarding</h2>
            <p className="text-sm text-gray-500">{completedRequired} of {totalRequired} required items completed</p>
          </div>
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-wrap">
          {allTemplates.map((t, i) => {
            const rec = localRecords.find(r => r.template_id === t.id);
            const done = rec?.status === 'completed';
            return (
              <button
                key={t.id}
                onClick={() => setStep(i)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  i === step ? 'bg-blue-700 text-white border-blue-700' :
                  done ? 'bg-green-100 text-green-700 border-green-300' :
                  'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {done && '✓ '}{t.title}{t.is_required ? ' *' : ''}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{current.title}</h3>
              <p className="text-xs text-gray-500">{TYPE_LABELS[current.completion_type]}{current.is_required ? ' · Required' : ' · Optional'}</p>
            </div>
          </div>

          <StepView
            template={current}
            record={currentRecord}
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <div className="flex gap-2">
            {!current.is_required && currentRecord?.status !== 'completed' && (
              <Button variant="ghost" onClick={handleSkip} disabled={saving} className="text-gray-500">
                Skip
              </Button>
            )}
            {currentRecord?.status !== 'completed' && (
              <Button onClick={handleStepComplete} disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white">
                {saving ? 'Saving...' : 'Mark Complete'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {currentRecord?.status === 'completed' && step < allTemplates.length - 1 && (
              <Button onClick={() => setStep(s => s + 1)} className="bg-blue-700 hover:bg-blue-800 text-white">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {allRequiredDone && (
              <Button onClick={onComplete} className="bg-green-700 hover:bg-green-800 text-white">
                Finish Onboarding ✓
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}