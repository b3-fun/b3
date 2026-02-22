"use client";

import { motion } from "framer-motion";
import { AnimatedCheckmark } from "../icons/AnimatedCheckmark";

export interface Step {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepProgressProps {
  steps: Step[];
  currentStepIndex: number;
  className?: string;
  /** When false, completed step checkmarks render in their static (post-animation) state.
   *  Use false when the step was already completed in a previous render (e.g. transitioning
   *  between sub-states within the same step). Defaults to true. */
  animateCompletedSteps?: boolean;
}

export function StepProgress({
  steps,
  currentStepIndex,
  className = "",
  animateCompletedSteps = true,
}: StepProgressProps) {
  const currentStep = steps[currentStepIndex];

  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
      {/* Step Progress Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((_, index) => (
          <>
            <div key={index} className="flex items-center">
              {index < currentStepIndex ? (
                // Completed step - checkmark replaces the whole circle
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <AnimatedCheckmark className="h-10 w-10" strokeWidth={2.5} static={!animateCompletedSteps} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`border-as-border-secondary relative flex h-10 w-10 items-center justify-center rounded-full border-[3px]`}
                >
                  {index === currentStepIndex ? (
                    // Current step - show spinning border and step number
                    <>
                      <div className="border-t-as-primary absolute -inset-0.5 animate-spin rounded-full border-[3px] border-transparent" />
                      <span className="text-as-primary font-semibold">{index + 1}</span>
                    </>
                  ) : (
                    // Future step - show step number with disabled styling
                    <span className="text-as-content-disabled font-semibold">{index + 1}</span>
                  )}
                </motion.div>
              )}
            </div>
            {/* Connector dots - don't show after last step */}
            {index < steps.length - 1 && (
              <div className="flex w-8 items-center justify-center gap-1">
                {Array.from({ length: 6 }).map((_, dotIndex) => (
                  <div key={dotIndex} className="bg-as-primary/30 h-[2px] w-[2px] rounded-full" />
                ))}
              </div>
            )}
          </>
        ))}
      </div>

      {/* Step Description */}
      {currentStep && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-as-primary text-xl font-semibold">{currentStep.title}</h2>
          {currentStep.description && <p className="text-as-tertiary mt-1 text-sm">{currentStep.description}</p>}
        </motion.div>
      )}
    </div>
  );
}
