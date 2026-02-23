import { getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useSearchParams } from "@b3dotfun/sdk/shared/react";
import { Clock, Loader2, RotateCcw, X } from "lucide-react";
import React, { memo, useEffect, useRef } from "react";
import { useAnySpendCustomization } from "../context/AnySpendCustomizationContext";
import { AnimatedCheckmark } from "../icons/AnimatedCheckmark";
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
  const { text: defaultText, description: defaultDescription } = getStatusDisplay(order);
  const { content, slots } = useAnySpendCustomization();
  const searchParams = useSearchParams();
  const cryptoPaymentMethod = selectedCryptoPaymentMethod || searchParams.get("cryptoPaymentMethod");

  const currentStepIndex = getStepIndex(order.status);
  const prevStepIndexRef = useRef<number>(currentStepIndex);
  const shouldAnimateCheck = currentStepIndex > prevStepIndexRef.current;

  useEffect(() => {
    prevStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  // Resolve content overrides based on order status
  let text = defaultText;
  let description: string | React.ReactNode = defaultDescription;

  if (order.status === "executed") {
    if (content.successTitle && typeof content.successTitle === "string") text = content.successTitle;
    if (content.successDescription) description = content.successDescription;
  } else if (order.status === "failure") {
    if (content.failureTitle && typeof content.failureTitle === "string") text = content.failureTitle;
    if (content.failureDescription) description = content.failureDescription;
  } else if (order.status === "expired") {
    if (content.expiredTitle && typeof content.expiredTitle === "string") text = content.expiredTitle;
    if (content.expiredDescription) description = content.expiredDescription;
  } else if (order.status === "refunded") {
    if (content.refundedTitle && typeof content.refundedTitle === "string") text = content.refundedTitle;
    if (content.refundedDescription) description = content.refundedDescription;
  } else if (content.processingTitle || content.processingDescription) {
    if (content.processingTitle && typeof content.processingTitle === "string") text = content.processingTitle;
    if (content.processingDescription) description = content.processingDescription;
  }

  const paymentSteps: Step[] = [
    { id: 1, title: text, description: typeof description === "string" ? description : defaultDescription || "" },
    { id: 2, title: text, description: typeof description === "string" ? description : defaultDescription || "" },
  ];

  if (currentStepIndex === 0) {
    if (!(order.status === "scanning_deposit_transaction" && cryptoPaymentMethod === "transfer_crypto")) {
      return <StepProgress steps={paymentSteps} currentStepIndex={0} />;
    }
  }

  if (currentStepIndex === 1) {
    return <StepProgress steps={paymentSteps} currentStepIndex={1} animateCompletedSteps={shouldAnimateCheck} />;
  }

  if (order.status === "refunding") {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
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

  if (order.status === "executed") {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <AnimatedCheckmark className="h-14 w-14" />
          <h2 className="text-as-primary mt-4 text-xl font-semibold">{content.successTitle || text}</h2>
          <div className="text-as-tertiary mt-1 text-center text-sm">{content.successDescription || description}</div>
        </div>
      </div>
    );
  }

  if (order.status === "expired") {
    if (slots.errorScreen) {
      return (
        <>
          {slots.errorScreen({
            title: text,
            description: typeof description === "string" ? description : defaultDescription || "",
            errorType: "expired",
            orderId: order.id,
          })}
        </>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="text-as-primary mt-4 text-xl font-semibold">{text}</h2>
          <div className="text-as-tertiary mt-1 text-center text-sm">{description}</div>
        </div>
      </div>
    );
  }

  if (order.status === "refunded") {
    if (slots.errorScreen) {
      return (
        <>
          {slots.errorScreen({
            title: text,
            description: typeof description === "string" ? description : defaultDescription || "",
            errorType: "refunded",
            orderId: order.id,
          })}
        </>
      );
    }
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

  if (slots.errorScreen) {
    return (
      <>
        {slots.errorScreen({
          title: text,
          description: typeof description === "string" ? description : defaultDescription || "",
          errorType: "failure",
          orderId: order.id,
        })}
      </>
    );
  }
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
