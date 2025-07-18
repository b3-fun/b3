import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ShinyButton } from "@b3dotfun/sdk/global-account/react";
import { getPaymentMethodDescription, getVendorDisplayName } from "@b3dotfun/sdk/shared/utils/payment.utils";
import { ChevronRight } from "lucide-react";
import HowItWorks from "./HowItWorks";

interface PaymentOneClickProps {
  order: components["schemas"]["Order"];
  dstTokenSymbol: string;
}

export default function PaymentOneClick({ order }: PaymentOneClickProps) {
  const vendor = order.onrampMetadata?.vendor;
  const vendorName = getVendorDisplayName(vendor);
  const paymentDescription = getPaymentMethodDescription(vendor);

  const howItWorksSteps = [
    {
      number: 1,
      description: `Click the link above to pay with ${paymentDescription}`,
    },
    {
      number: 2,
      description: `After payment, you'll be redirected back here, where we continue to execute the order.`,
    },
  ];

  return (
    <div className="relative my-8 flex w-full flex-1 flex-col items-center justify-center">
      <a href={order.oneClickBuyUrl || ""} target="_blank" className="w-4/5">
        <ShinyButton accentColor={"hsl(var(--as-brand))"} className="relative w-full py-6">
          <div className="relative z-10 flex items-center justify-center gap-3">
            <span className="text-lg font-medium text-white">Continue to {vendorName}</span>
            <ChevronRight className="h-5 w-5 text-white/90" />
          </div>
        </ShinyButton>
      </a>

      <HowItWorks steps={howItWorksSteps} />
    </div>
  );
}
