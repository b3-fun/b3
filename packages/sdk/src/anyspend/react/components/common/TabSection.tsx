import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { FiatPaymentMethod } from "./FiatPaymentMethod";

interface TabSectionProps {
  activeTab: "crypto" | "fiat";
  setActiveTab: (tab: "crypto" | "fiat") => void;
  setSelectedCryptoPaymentMethod: (method: CryptoPaymentMethodType) => void;
  setSelectedFiatPaymentMethod: (method: FiatPaymentMethod) => void;
}

export function TabSection({
  activeTab,
  setActiveTab,
  setSelectedCryptoPaymentMethod,
  setSelectedFiatPaymentMethod,
}: TabSectionProps) {
  return (
    <div className="tab-section w-full">
      <div className="bg-as-surface-secondary relative mb-4 grid h-10 grid-cols-2 rounded-xl">
        <div
          className={cn(
            "bg-as-brand absolute bottom-0 left-0 top-0 z-0 rounded-xl transition-transform duration-100",
            "h-full w-1/2",
            activeTab === "fiat" ? "translate-x-full" : "translate-x-0",
          )}
          style={{ willChange: "transform" }}
        />
        <button
          className={cn(
            "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium transition-colors duration-100",
            activeTab === "crypto" ? "text-white" : "text-as-primary/70 hover:bg-as-on-surface-2 bg-transparent",
          )}
          onClick={() => {
            setActiveTab("crypto");
            setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE); // Reset payment method when switching to crypto
            setSelectedFiatPaymentMethod(FiatPaymentMethod.NONE); // Reset fiat payment method when switching to crypto
          }}
        >
          Pay with crypto
        </button>
        <button
          className={cn(
            "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium transition-colors duration-100",
            activeTab === "fiat" ? "text-white" : "text-as-primary/70 hover:bg-as-on-surface-2 bg-transparent",
          )}
          onClick={() => {
            setActiveTab("fiat");
            setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE); // Reset crypto payment method when switching to fiat
            setSelectedFiatPaymentMethod(FiatPaymentMethod.NONE); // Reset fiat payment method when switching to fiat
          }}
        >
          Pay with Fiat
        </button>
      </div>
    </div>
  );
}
