import { getTrainingStepSections } from "@/lib/training/trainingNavigation";

export default function TrainingSidebarSteps({ module, isActive, activeStepIndex, onJump }) {
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
    </div>
  );
}