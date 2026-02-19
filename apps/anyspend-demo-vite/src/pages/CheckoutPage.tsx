import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { AnySpendCheckout, type CheckoutItem } from "@b3dotfun/sdk/anyspend/react";
import { parseUnits } from "viem";

const DEMO_RECIPIENT = "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4";

const DEMO_ITEMS: CheckoutItem[] = [
  {
    id: "item-1",
    name: "B3kemon Starter Pack",
    description: "3 random B3kemon creatures to start your journey",
    imageUrl: "https://cdn.b3.fun/b3kemon-card.png",
    amount: parseUnits("100", 18).toString(), // 100 B3
    quantity: 1,
  },
  {
    id: "item-2",
    name: "Rare Pokeball",
    description: "Increases catch rate by 2x",
    amount: parseUnits("50", 18).toString(), // 50 B3
    quantity: 2,
  },
];

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 pt-8">
      <AnySpendCheckout
        mode="page"
        recipientAddress={DEMO_RECIPIENT}
        destinationTokenAddress={B3_TOKEN.address}
        destinationTokenChainId={B3_TOKEN.chainId}
        items={DEMO_ITEMS}
        organizationName="B3kemon Shop"
        organizationLogo="https://cdn.b3.fun/b3kemon-card.png"
        buttonText="Pay Now"
        onSuccess={result => {
          console.log("Payment success:", result);
        }}
        onError={error => {
          console.error("Payment error:", error);
        }}
        returnUrl="/"
        returnLabel="Back to Home"
      />
    </div>
  );
}
