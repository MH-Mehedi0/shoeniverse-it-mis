export function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number; // 1-indexed
}) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((label, idx) => {
        const step = idx + 1;
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                  isDone
                    ? "border-brand-600 bg-brand-600 text-white"
                    : isActive
                      ? "border-brand-600 bg-white text-brand-600"
                      : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {isDone ? "✓" : step}
              </div>
              <span
                className={`mt-1.5 max-w-[6.5rem] text-center text-xs font-medium ${
                  isActive ? "text-brand-700" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </div>
            {step < steps.length && (
              <div className={`mx-2 h-0.5 flex-1 ${isDone ? "bg-brand-600" : "bg-slate-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
