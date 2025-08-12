"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

export interface Step {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepProgressProps {
  steps: Step[];
  currentStepIndex: number;
  className?: string;
}

export function StepProgress({ steps, currentStepIndex, className = "" }: StepProgressProps) {
  const currentStep = steps[currentStepIndex];

  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
      {/* Step Progress Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <>
            <div key={index} className="flex items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.2 }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                  index < currentStepIndex
                    ? "bg-as-success-secondary" // Completed step
                    : index === currentStepIndex
                      ? "border-as-border-secondary border-[3px]" // Current step
                      : "border-as-border-secondary border-[3px]" // Future step
                } `}
              >
                {index < currentStepIndex ? (
                  // Completed step - show check icon
                  <CheckIcon className="text-as-content-icon-success h-6 w-6" />
                ) : index === currentStepIndex ? (
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
          {currentStep.description && <p className="text-as-primary/50 mt-1 text-sm">{currentStep.description}</p>}
        </motion.div>
      )}
    </div>
  );
}

// Example usage:
/*
// Basic 3-step process
const paymentSteps = [
  { id: 1, title: "Connect Wallet", description: "Connect your wallet to continue" },
  { id: 2, title: "Confirm Transaction", description: "Review and confirm your transaction" },
  { id: 3, title: "Complete Payment", description: "Finalize your transaction" }
];

// 5-step onboarding process
const onboardingSteps = [
  { id: "signup", title: "Sign Up", description: "Create your account" },
  { id: "verify", title: "Verify Email", description: "Check your email for verification" },
  { id: "profile", title: "Setup Profile", description: "Complete your profile information" },
  { id: "preferences", title: "Set Preferences", description: "Configure your settings" },
  { id: "complete", title: "All Done!", description: "Welcome to the platform" }
];

// Usage in component:
<StepProgress steps={paymentSteps} currentStepIndex={1} />
<StepProgress steps={onboardingSteps} currentStepIndex={2} className="my-8" />
*/
