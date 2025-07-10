import { useCoinbaseOnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { Input, useGetGeo } from "@b3dotfun/sdk/global-account/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { toast } from "sonner";
import { PaymentOptions } from "./PaymentOptions";

export function PanelOnramp({
  srcAmountOnRamp,
  setSrcAmountOnRamp,
}: {
  srcAmountOnRamp: string;
  setSrcAmountOnRamp: (amount: string) => void;
}) {
  // Get geo data for onramp availability
  const { geoData } = useGetGeo();
  const { coinbaseOnrampOptions } = useCoinbaseOnrampOptions(true, geoData?.country || "US");

  const amountInputRef = useRef<HTMLInputElement>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, "");
    // Get the max limit from payment currencies
    const maxLimit =
      coinbaseOnrampOptions?.paymentCurrencies?.[0]?.limits?.find(l => l.id === "ACH_BANK_ACCOUNT")?.max || "25000";
    const numValue = parseFloat(value);
    if (!Number.isNaN(numValue) && numValue > parseFloat(maxLimit)) {
      toast.error(`Maximum amount is $${maxLimit}`);
      setSrcAmountOnRamp(maxLimit);
      return;
    }
    setSrcAmountOnRamp(value);
  };

  const handleQuickAmount = (value: string) => {
    setSrcAmountOnRamp(value);
  };

  return (
    <div className="bg-as-on-surface-1 relative flex w-full flex-col gap-4 rounded-2xl p-4 pb-6">
      <div className="flex h-7 w-full items-center justify-between">
        <span className="text-as-primary/50 flex items-center text-sm">Buy</span>
        <PaymentOptions />
      </div>
      <div className="hover:bg-as-brand/30 hover:border-as-brand border-as-stroke relative flex w-full flex-col items-center justify-center rounded-lg border transition-all duration-200">
        {parseFloat(srcAmountOnRamp) >
        (coinbaseOnrampOptions?.paymentCurrencies?.[0]?.limits?.find(l => l.id === "ACH_BANK_ACCOUNT")?.max
          ? parseFloat(
              coinbaseOnrampOptions.paymentCurrencies[0].limits.find(l => l.id === "ACH_BANK_ACCOUNT")?.max || "25000",
            )
          : 25000) ? (
          <p className="label-style -mb-3 mt-3 text-xs text-red-400 dark:bg-transparent">
            Maximum amount is $
            {coinbaseOnrampOptions?.paymentCurrencies?.[0]?.limits?.find(l => l.id === "ACH_BANK_ACCOUNT")?.max ||
              "25,000"}
          </p>
        ) : (
          <p className="label-style text-b3-react-foreground/60 -mb-3 mt-3 text-xs dark:bg-transparent">
            Buy amount in USD
          </p>
        )}

        <div className="relative inline-flex items-center dark:bg-transparent">
          <span className="text-b3-react-foreground/60 -ms-3 -mt-2 text-2xl font-semibold dark:bg-transparent">$</span>
          <Input
            ref={amountInputRef}
            type="text"
            value={srcAmountOnRamp}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="placeholder:text-b3-react-foreground/60 h-auto min-w-[70px] border-0 bg-transparent py-6 text-center text-4xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
            style={{
              width: `${Math.max(50, srcAmountOnRamp.length * 34)}px`,
              minWidth: srcAmountOnRamp ? `auto` : "105px",
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: !srcAmountOnRamp || parseFloat(srcAmountOnRamp) <= 0 ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="border-b3-react-foreground/10 absolute bottom-3 left-1 h-1 w-[90%] rounded-full border-t-2 border-dashed bg-transparent"
            />
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {["5", "10", "25", "100"].map(value => (
          <button
            key={value}
            onClick={() => handleQuickAmount(value)}
            className={`rounded-lg border px-4 py-3 ${
              srcAmountOnRamp === value
                ? "border-as-brand bg-as-brand/30"
                : "border-as-stroke hover:border-as-brand hover:bg-as-brand/30"
            } transition-all duration-200`}
          >
            ${value}
          </button>
        ))}
      </div>
    </div>
  );
}
