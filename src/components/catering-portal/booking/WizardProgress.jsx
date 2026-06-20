import React from 'react';
import { Check } from 'lucide-react';

export default function WizardProgress({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                done ? 'bg-cp-primary border-cp-primary text-white' :
                active ? 'bg-white border-cp-primary text-cp-primary' :
                'bg-white border-gray-200 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-cp-primary' : done ? 'text-cp-primary' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mt-[-10px] ${done ? 'bg-cp-primary' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}