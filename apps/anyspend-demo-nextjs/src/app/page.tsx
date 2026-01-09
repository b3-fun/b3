"use client";

import { useState } from "react";
import { BondKitButton } from "./components/BondKitButton";
import { BuyHyperliquidUSDCButton } from "./components/BuyHyperliquidUSDCButton";
import { BuyWithFiatButton } from "./components/BuyWithFiatButton";
import { CollectorClubPurchaseButton } from "./components/CollectorClubPurchaseButton";
import { CustomClassesDepositButton } from "./components/CustomClassesDepositButton";
import { CustomDepositButton } from "./components/CustomDepositButton";
import { DepositHypeButton } from "./components/DepositHypeButton";
import { GetB3TokenButton } from "./components/GetB3TokenButton";
import { MintNftButton } from "./components/MintNftButton";
import { OrderDetailsButton } from "./components/OrderDetailsButton";
import { OrderlyDepositButton } from "./components/OrderlyDepositButton";
import { AnySpendOrderlyDepositButton } from "./components/AnySpendOrderlyDepositButton";
import { SignInButton } from "./components/SignInButton";
import { SignatureMintButton } from "./components/SignatureMintButton";
import { SignatureMintModal } from "./components/SignatureMintModal";
import { StakeB3Button } from "./components/StakeB3Button";
import { StakeB3ExactInButton } from "./components/StakeB3ExactInButton";
import { StakeUpsideButton } from "./components/StakeUpsideButton";
import { StakeUpsideButtonExactIn } from "./components/StakeUpsideButtonExactIn";
import { SwapTokensButton } from "./components/SwapTokensButton";

export default function Home() {
  const [isSignatureMintOpen, setIsSignatureMintOpen] = useState(false);

  return (
    <div
      className="relative min-h-screen"
      style={{
        height: "100vh",
        background: "linear-gradient(to bottom, #3B82F6 0%, #FFFFFF 100%)",
      }}
    >
      <img
        src="https://cdn.b3.fun/anyspend/hero-clouds.png"
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        alt="Anyspend Clouds"
      />

      <SignInButton />
      <SignatureMintModal isOpen={isSignatureMintOpen} onClose={() => setIsSignatureMintOpen(false)} />
      <div className="container relative z-10 mx-auto mb-10 px-6 py-20">
        <div className="mx-auto mb-20 max-w-6xl pt-12">
          <h1 className="mb-3 text-start text-3xl font-bold text-white">AnySpend Demo</h1>
          <p className="mb-12 text-start text-white/50">Swap any token, onramp anyone.</p>

          <div className="grid grid-cols-2 gap-8 pb-10">
            <SwapTokensButton />
            <BuyWithFiatButton />
            <MintNftButton />
            <GetB3TokenButton />
            <StakeB3Button />
            <StakeB3ExactInButton />
            <StakeUpsideButton />
            <StakeUpsideButtonExactIn />
            <SignatureMintButton onClick={() => setIsSignatureMintOpen(true)} />
            <BondKitButton />
            <DepositHypeButton />
            <CustomDepositButton />
            <BuyHyperliquidUSDCButton />
            <CollectorClubPurchaseButton />
            <OrderDetailsButton />
            <OrderlyDepositButton />
            <AnySpendOrderlyDepositButton />
            <CustomClassesDepositButton />
          </div>
        </div>
      </div>
    </div>
  );
}
