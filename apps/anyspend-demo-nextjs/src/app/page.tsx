"use client";

import { useState } from "react";
import { SignInButton } from "./components/SignInButton";
import { SignatureMintModal } from "./components/SignatureMintModal";
import { SwapTokensButton } from "./components/SwapTokensButton";
import { BuyWithFiatButton } from "./components/BuyWithFiatButton";
import { MintB3kemonButton } from "./components/MintB3kemonButton";
import { GetB3TokenButton } from "./components/GetB3TokenButton";
import { SignatureMintButton } from "./components/SignatureMintButton";
import { BondKitButton } from "./components/BondKitButton";

export default function Home() {
  const [isSignatureMintOpen, setIsSignatureMintOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#FAFAFA]">
      <SignInButton />
      <SignatureMintModal isOpen={isSignatureMintOpen} onClose={() => setIsSignatureMintOpen(false)} />
      <div className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-center text-3xl font-bold text-gray-800">AnySpend Demo</h1>
          <p className="mb-12 text-center text-gray-500">Experience seamless crypto transactions</p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SwapTokensButton />
            <BuyWithFiatButton />
            <MintB3kemonButton />
            <GetB3TokenButton />
            <SignatureMintButton onClick={() => setIsSignatureMintOpen(true)} />
            <BondKitButton />
          </div>
        </div>
      </div>
    </div>
  );
}
