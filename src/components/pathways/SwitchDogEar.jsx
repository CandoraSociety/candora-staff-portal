import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowRightLeft } from 'lucide-react';

const SERVICE_LABELS = {
  direct_to_employment: "DEA",
  pathways: "WD",
  casual: "Casual",
  external_referral: "Ext. Referral",
  internal_referral: "Int. Referral",
  not_eligible: "Not Eligible",
};

export default function SwitchDogEar({ switches }) {
  if (!switches || switches.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-0 left-0 z-20"
          style={{
            width: '16px',
            height: '16px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #dc2626 50%, transparent 50%)',
          }}
          title="Program stream switched — click for details"
        />
      </PopoverTrigger>
      <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()} align="start" side="bottom" sideOffset={4}>
        <div className="space-y-3">
          {switches.map((sw, i) => (
            <div key={i} className="text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'hsl(231,64%,20%)' }}>
                <ArrowRightLeft className="w-3.5 h-3.5 text-red-600 shrink-0" />
                Switched from {SERVICE_LABELS[sw.from_stream] || sw.from_stream || '?'} to {SERVICE_LABELS[sw.to_stream] || sw.to_stream || '?'}
              </div>
              {sw.date && <div className="text-slate-500 pl-5">{sw.date}</div>}
              {sw.notes && <div className="text-slate-700 bg-slate-50 rounded p-2 pl-5">{sw.notes}</div>}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}