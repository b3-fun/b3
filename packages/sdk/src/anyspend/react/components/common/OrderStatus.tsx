import { getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useSearchParams } from "@b3dotfun/sdk/shared/react";
import { Check, X } from "lucide-react";
import { memo } from "react";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { Step, StepProgress } from "./StepProgress";

export const OrderStatus = memo(function OrderStatus({
  order,
  selectedCryptoPaymentMethod,
}: {
  order: components["schemas"]["Order"];
  selectedCryptoPaymentMethod?: CryptoPaymentMethodType;
}) {
  const isComplete = order.status === "executed";
  const { text, status: displayStatus, description } = getStatusDisplay(order);
  const searchParams = useSearchParams();
  const cryptoPaymentMethod = selectedCryptoPaymentMethod || searchParams.get("cryptoPaymentMethod");

  console.log("OrderStatus", displayStatus);
  console.log("OrderStatus", order);

  const paymentSteps: Step[] = [
    {
      id: 1,
      title: text,
      description: description,
    },
    {
      id: 2,
      title: text,
      description: description,
    },
  ];

  if (["waiting_stripe_payment", "scanning_deposit_transaction"].includes(order.status)) {
    // hide step if order is scanning_deposit_transaction and crypto payment method is transfer_crypto
    if (!(order.status === "scanning_deposit_transaction" && cryptoPaymentMethod === "transfer_crypto")) {
      return <StepProgress steps={paymentSteps} currentStepIndex={0} />;
    }
  }

  if (["relay", "executing", "sending_token_from_vault"].includes(order.status)) {
    return <StepProgress steps={paymentSteps} currentStepIndex={1} />;
  }

  if (selectedCryptoPaymentMethod === "transfer_crypto" && order.status === "scanning_deposit_transaction") {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {isComplete ? (
        <div className="flex flex-col items-center">
          <div className={`bg-as-success-secondary relative flex h-10 w-10 items-center justify-center rounded-full`}>
            <Check className="text-as-content-icon-success h-6 w-6" />
          </div>
          <h2 className="text-as-primary mt-4 text-xl font-semibold">{text}</h2>
          <div className="text-as-tertiarry mt-1 text-center">{description}</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="bg-as-error-secondary flex h-10 w-10 items-center justify-center rounded-full text-base">
            <X className="text-as-content-icon-error h-5 w-5" />
          </div>
          <div className="font-sf-rounded text-as-content-primary mt-4 text-lg font-semibold">{text}</div>
          <div className="text-as-tertiarry text-center" style={{ whiteSpace: "normal" }}>
            {description}
          </div>
        </div>
      )}
    </div>
  );
});
