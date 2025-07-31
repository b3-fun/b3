"use client";

import { AnySpend, AnySpendNFT } from "@b3dotfun/sdk/anyspend/react";
import { base } from "viem/chains";

export default function NFTDemoPage() {
  // Random token ID between 0 and 6 (same as MintNftButton)
  const randomTokenId = Math.floor(Math.random() * 7);

  const usdcOnBase = {
    chainId: base.id,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    metadata: {
      logoURI: "https://b3.fun/logo.png",
    },
  };

  const nftContract = {
    chainId: base.id,
    contractAddress: "0xe04074c294d0Db90F0ffBC60fa61b48672C91965",
    price: "1990000", // 1.99 USDC (6 decimals)
    priceFormatted: "1.99",
    currency: usdcOnBase,
    name: "Mystery B3kemon",
    description: "Summon a mysterious B3kemon creature!",
    tokenId: randomTokenId,
    type: "erc1155" as const,
    imageUrl: "",
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="w-[380px] overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
        <AnySpendNFT
          nftContract={nftContract}
          mode="modal"
          isMainnet={true}
          onSuccess={txHash => {
            console.log("Success!", txHash);
          }}
        />
      </div>
      <div className="w-[380px] overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
        <AnySpend
          mode="modal"
          destinationTokenAddress="0xb3b32f9f8827d4634fe7d973fa1034ec9fddb3b3"
          destinationTokenChainId={base.id}
          defaultActiveTab="fiat"
        />
      </div>
      <div className="w-[380px] overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
        <AnySpend mode="modal" defaultActiveTab="crypto" />
      </div>
    </div>
  );
}
