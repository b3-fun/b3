import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { FiatPaymentMethod } from "./FiatPaymentMethod";
import type { TabSectionClasses } from "../types/classes";

interface TabSectionProps {
  activeTab: "crypto" | "fiat";
  setActiveTab: (tab: "crypto" | "fiat") => void;
  setSelectedCryptoPaymentMethod: (method: CryptoPaymentMethodType) => void;
  setSelectedFiatPaymentMethod: (method: FiatPaymentMethod) => void;
  classes?: TabSectionClasses;
}

export function TabSection({
  activeTab,
  setActiveTab,
  setSelectedCryptoPaymentMethod,
  setSelectedFiatPaymentMethod,
  classes,
}: TabSectionProps) {
  return (
    <div className={classes?.root || "tab-section w-full"}>
      <div className={classes?.container || "bg-as-surface-secondary relative mb-4 grid h-10 grid-cols-2 rounded-xl"}>
        <div
          className={cn(
            classes?.tabIndicator ||
              "bg-as-brand absolute bottom-0 left-0 top-0 z-0 h-full w-1/2 rounded-xl transition-transform duration-100",
            activeTab === "fiat" ? "translate-x-full" : "translate-x-0",
          )}
          style={{ willChange: "transform" }}
        />
        <button
          className={cn(
            activeTab === "crypto"
              ? classes?.tabButtonActive ||
                  "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium text-white transition-colors duration-100"
              : classes?.tabButton ||
                  "text-as-primary/70 hover:bg-as-on-surface-2 relative z-10 h-full w-full rounded-xl bg-transparent px-3 text-sm font-medium transition-colors duration-100",
          )}
          onClick={() => {
            setActiveTab("crypto");
            setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE);
            setSelectedFiatPaymentMethod(FiatPaymentMethod.NONE);
          }}
        >
          Pay with crypto
        </button>
        <button
          className={cn(
            activeTab === "fiat"
              ? classes?.tabButtonActive ||
                  "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium text-white transition-colors duration-100"
              : classes?.tabButton ||
                  "text-as-primary/70 hover:bg-as-on-surface-2 relative z-10 h-full w-full rounded-xl bg-transparent px-3 text-sm font-medium transition-colors duration-100",
          )}
          onClick={() => {
            setActiveTab("fiat");
            setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE);
            setSelectedFiatPaymentMethod(FiatPaymentMethod.NONE);
          }}
        >
          Pay with Fiat
        </button>
      </div>
    </div>
  );
}
