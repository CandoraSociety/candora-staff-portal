import { Film } from "lucide-react";
import { getTrainingStepSections } from "@/lib/training/trainingNavigation";
import { getModuleRecap } from "@/lib/training/moduleRecaps";

export default function TrainingSidebarSteps({ module, isActive, activeStepIndex, onJump }) {
  const hasRecap = !!getModuleRecap(module.key);
  return (
    <div className="space-y-3 border-l border-sidebar-border pl-2">
      {getTrainingStepSections(module).map(section => (
        <section key={section.title}>
          <h3 className="mb-1 border-b border-sidebar-border pb-1 text-[10px] font-bold text-sidebar-foreground/85">
            {section.title}
          </h3>
          {section.steps.map(step => {
            const current = isActive && activeStepIndex === step.index;
            return (
              <button key={step.index} onClick={() => onJump(module, step.index)}
                aria-current={current ? "step" : undefined}
                title={isActive ? "Jump to this step" : "Switch to this training at this step"}
                className={`flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-sidebar-accent ${current ? "bg-sidebar-primary/20 text-sidebar-primary" : "text-sidebar-foreground/70"}`}>
                <span className="mt-px w-4 shrink-0 text-center text-[9px]">{step.index + 1}</span>
                <span className="text-[10px] leading-snug">{step.title}</span>
              </button>
            );
          })}
        </section>
      ))}
      {/* The wrap-up is the module's own last part, not a separate activity */}
      {hasRecap && (
        <button
          onClick={() => onJump(module, module.steps.length)}
          title="Open the module's recap and quiz"
          className="flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left text-sidebar-primary hover:bg-sidebar-accent"
        >
          <Film className="mt-px h-3 w-3 shrink-0" />
          <span className="text-[10px] font-semibold leading-snug">What we've learned</span>
        </button>
      )}
    </div>
  );
}