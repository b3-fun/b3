'use client';

import { useState } from 'react';
import { BondKitButton } from './components/BondKitButton';
import { BuyWithFiatButton } from './components/BuyWithFiatButton';
import { GetB3TokenButton } from './components/GetB3TokenButton';
import { MintNftButton } from './components/MintNftButton';
import { SignInButton } from './components/SignInButton';
import { SignatureMintButton } from './components/SignatureMintButton';
import { SignatureMintModal } from './components/SignatureMintModal';
import { SwapTokensButton } from './components/SwapTokensButton';

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
            <MintNftButton />
            <GetB3TokenButton />
            <SignatureMintButton onClick={() => setIsSignatureMintOpen(true)} />
            <BondKitButton />
          </div>
        </div>
      </div>
    </div>
  );
}
