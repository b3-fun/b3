import { getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useSearchParams } from "@b3dotfun/sdk/shared/react";
import { Clock, Loader2, RotateCcw, X } from "lucide-react";
import { AnimatedCheckmark } from "../icons/AnimatedCheckmark";
import { memo, useEffect, useRef } from "react";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { Step, StepProgress } from "./StepProgress";

/** Map order status to its step index in the StepProgress. -1 = not a step state. */
function getStepIndex(status: string): number {
  if (["waiting_stripe_payment", "scanning_deposit_transaction"].includes(status)) return 0;
  if (["quoting_after_deposit", "sending_token_from_vault", "relay", "executing"].includes(status)) return 1;
  return -1;
}

export const OrderStatus = memo(function OrderStatus({
  order,
  selectedCryptoPaymentMethod,
}: {
  order: components["schemas"]["Order"];
  selectedCryptoPaymentMethod?: CryptoPaymentMethodType;
}) {
  const { text, status: displayStatus, description } = getStatusDisplay(order);
  const searchParams = useSearchParams();
  const cryptoPaymentMethod = selectedCryptoPaymentMethod || searchParams.get("cryptoPaymentMethod");

  // Track previous step index to determine if the checkmark should animate or be static.
  // When transitioning from step 0 → step 1, animate (first time seeing completed step).
  // When staying within step 1 (e.g. relay → executing), show static (already completed).
  const currentStepIndex = getStepIndex(order.status);
  const prevStepIndexRef = useRef<number>(currentStepIndex);

  // The checkmark should animate only when we just entered a new step
  const shouldAnimateCheck = currentStepIndex > prevStepIndexRef.current;

  useEffect(() => {
    prevStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  const paymentSteps: Step[] = [
    { id: 1, title: text, description },
    { id: 2, title: text, description },
  ];

  // Step 0: Early processing states (waiting for deposit/payment)
  if (currentStepIndex === 0) {
    if (!(order.status === "scanning_deposit_transaction" && cryptoPaymentMethod === "transfer_crypto")) {
      return <StepProgress steps={paymentSteps} currentStepIndex={0} />;
    }
  }

  // Step 1: Mid-processing states (executing the order)
  if (currentStepIndex === 1) {
    return (
      <StepProgress
        steps={paymentSteps}
        currentStepIndex={1}
        animateCompletedSteps={shouldAnimateCheck}
      />
    );
  }

  // Refunding: active processing state with spinner
  if (order.status === "refunding") {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="bg-amber-500/15 flex h-12 w-12 items-center justify-center rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
          <h2 className="text-as-primary mt-4 text-xl font-semibold">{text}</h2>
          <div className="text-as-tertiary mt-1 text-center text-sm">{description}</div>
        </div>
      </div>
    );
  }

  if (selectedCryptoPaymentMethod === "transfer_crypto" && order.status === "scanning_deposit_transaction") {
    return null;
  }

  // Terminal success state — always animate (this is the big moment)
  if (order.status === "executed") {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <AnimatedCheckmark className="h-14 w-14" />
          <h2 className="text-as-primary mt-4 text-xl font-semibold">{text}</h2>
          <div className="text-as-tertiary mt-1 text-center text-sm">{description}</div>
        </div>
      </div>
    );
  }

  // Expired: warning treatment (amber clock)
  if (order.status === "expired") {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="bg-amber-500/15 flex h-10 w-10 items-center justify-center rounded-full">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="text-as-primary mt-4 text-xl font-semibold">{text}</h2>
          <div className="text-as-tertiary mt-1 text-center text-sm">{description}</div>
        </div>
      </div>
    );
  }

  // Refunded: neutral treatment (not a failure, funds returned)
  if (order.status === "refunded") {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="bg-as-surface-secondary flex h-10 w-10 items-center justify-center rounded-full">
            <RotateCcw className="text-as-secondary h-5 w-5" />
          </div>
          <h2 className="text-as-primary mt-4 text-xl font-semibold">{text}</h2>
          <div className="text-as-tertiary mt-1 text-center text-sm">{description}</div>
        </div>
      </div>
    );
  }

  // Failure: red error treatment (default fallback)
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex flex-col items-center">
        <div className="bg-as-error-secondary flex h-10 w-10 items-center justify-center rounded-full">
          <X className="text-as-content-icon-error h-5 w-5" />
        </div>
        <h2 className="text-as-primary mt-4 text-xl font-semibold">{text}</h2>
        <div className="text-as-tertiary mt-1 text-center text-sm" style={{ whiteSpace: "normal" }}>
          {description}
        </div>
      </div>
    </div>
  );
});
