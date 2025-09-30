import { ALL_CHAINS, chainIdToPublicClient, getChainName, getExplorerAddressUrl } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GlareCard, Popover, PopoverContent, PopoverTrigger } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { getIpfsUrl } from "@b3dotfun/sdk/shared/utils/ipfs";

import { formatDisplayNumber, formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { MoreVertical } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { b3 } from "viem/chains";
import { GetQuoteResponse } from "../../types/api_req_res";
import { useFeatureFlags } from "../contexts/FeatureFlagsContext";
import { AnySpendCustom } from "./AnySpendCustom";
import { PointsBadge } from "./common/PointsBadge";

// ABI for contractURI and uri functions
const CONTRACT_URI_ABI = [
  {
    inputs: [],
    name: "contractURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "uri",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function AnySpendNFT({
  loadOrder,
  mode = "modal",
  recipientAddress,
  nftContract,
  onSuccess,
  onShowPointsDetail,
}: {
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress?: string;
  nftContract: components["schemas"]["NftContract"];
  onSuccess?: (txHash?: string) => void;
  onShowPointsDetail?: () => void;
}) {
  const [imageUrlWithFallback, setFallbackImageUrl] = useState<string | null>(nftContract.imageUrl);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const featureFlags = useFeatureFlags();

  // Fetch contract metadata when imageUrl is empty
  useEffect(() => {
    async function fetchContractMetadata() {
      // fetch image Uri if not provided
      if (nftContract.imageUrl || isLoadingFallback) {
        return;
      }

      try {
        setIsLoadingFallback(true);

        // Use the chainIdToPublicClient utility function
        const publicClient = chainIdToPublicClient(nftContract.chainId);

        let metadataURI: string;

        // Use uri function if tokenId is available, otherwise use contractURI
        if (nftContract.tokenId !== null && nftContract.tokenId !== undefined) {
          console.log("Using uri function with tokenId:", nftContract.tokenId);
          metadataURI = await publicClient.readContract({
            address: nftContract.contractAddress as `0x${string}`,
            abi: CONTRACT_URI_ABI,
            functionName: "uri",
            args: [BigInt(nftContract.tokenId)],
          });
        } else {
          console.log("Using contractURI function");
          metadataURI = await publicClient.readContract({
            address: nftContract.contractAddress as `0x${string}`,
            abi: CONTRACT_URI_ABI,
            functionName: "contractURI",
          });
        }

        if (metadataURI) {
          // Fetch the metadata from IPFS
          const metadataUrl = getIpfsUrl(metadataURI);
          const response = await fetch(metadataUrl);
          const metadata = await response.json();

          if (metadata.image) {
            const fallbackUrl = getIpfsUrl(metadata.image);
            setFallbackImageUrl(fallbackUrl);
            console.log("fallbackImageUrl", fallbackUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching contract metadata:", error);
      } finally {
        setIsLoadingFallback(false);
      }
    }

    fetchContractMetadata();
  }, [nftContract.contractAddress, nftContract.chainId, nftContract.imageUrl, nftContract.tokenId, isLoadingFallback]);

  const header = ({
    anyspendPrice,
    isLoadingAnyspendPrice,
  }: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => (
    <>
      <div className="relative size-[200px]">
        <div className="absolute inset-0 scale-95 bg-black/30 blur-md"></div>
        <GlareCard className="overflow-hidden">
          {imageUrlWithFallback && (
            <img src={imageUrlWithFallback} alt={nftContract.name} className="size-full object-cover" />
          )}
          <div className="absolute inset-0 rounded-xl border border-white/10"></div>
        </GlareCard>

        <DropdownMenu nftContract={nftContract} />
      </div>
      <div className="from-b3-react-background to-as-on-surface-1 -mb-5 mt-[-100px] w-full rounded-t-lg bg-gradient-to-t">
        <div className="h-[100px] w-full" />
        <div className="mb-1 flex w-full flex-col items-center gap-2 p-5">
          <span className="font-sf-rounded text-2xl font-semibold">{nftContract.name}</span>

          <div className="flex w-fit items-center gap-2">
            {anyspendPrice ? (
              <AnimatePresence mode="wait">
                <div
                  className={cn("text-as-primary group flex items-center text-3xl font-semibold transition-all", {
                    "opacity-0": isLoadingAnyspendPrice,
                  })}
                >
                  {formatDisplayNumber(anyspendPrice?.data?.currencyIn?.amountUsd, { style: "currency" })}
                </div>
              </AnimatePresence>
            ) : (
              <div className="h-[36px] w-full" />
            )}
            {featureFlags.showPoints && anyspendPrice?.data?.pointsAmount > 0 && (
              <PointsBadge
                pointsAmount={anyspendPrice.data.pointsAmount}
                pointsMultiplier={anyspendPrice.data.pointsMultiplier}
                onClick={() => onShowPointsDetail?.()}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <AnySpendCustom
      loadOrder={loadOrder}
      mode={mode}
      activeTab="fiat"
      recipientAddress={recipientAddress}
      orderType={"mint_nft"}
      dstChainId={nftContract.chainId}
      dstToken={nftContract.currency}
      dstAmount={nftContract.price}
      contractAddress={nftContract.contractAddress}
      encodedData="0x"
      metadata={{
        type: "mint_nft",
        nftContract: nftContract,
      }}
      header={header}
      onSuccess={onSuccess}
    />
  );
}

function DropdownMenu({ nftContract }: { nftContract: components["schemas"]["NftContract"] }) {
  const [open, setOpen] = useState(false);
  const chain = ALL_CHAINS[nftContract.chainId];
  const nftUrl = getExplorerAddressUrl(nftContract.chainId, nftContract.contractAddress);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="absolute bottom-3 right-3 z-10 flex items-center justify-center rounded-full bg-black/20 p-1 text-white hover:bg-black/30"
          aria-label="Open NFT menu"
        >
          <MoreVertical className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="bg-b3-react-background border-b3-react-border min-w-48 rounded-lg border p-0 shadow-md backdrop-blur-sm"
      >
        <div className="pointer-events-auto flex w-full flex-col gap-2 py-2">
          <div className="hover:bg-as-on-surface-3 flex cursor-default items-center gap-2 rounded px-2 text-sm">
            Native mint price:
            <span className="font-semibold">
              {formatTokenAmount(BigInt(nftContract.price), nftContract.currency.decimals, 6, false)}{" "}
              {nftContract.currency.symbol}
            </span>
          </div>

          <div className="hover:bg-as-on-surface-3 flex cursor-default items-center gap-2 rounded px-2">
            <img src={chain?.logoUrl} className={cn("h-5 w-5", nftContract.chainId !== b3.id && "rounded-full")} />
            <span className="text-sm">
              Minted on <span className="font-semibold">{chain ? getChainName(nftContract.chainId) : "Unknown"}</span>
            </span>
          </div>
          <a
            href={nftUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-as-on-surface-3 text-as-primary flex items-center gap-2 rounded px-2 text-sm"
          >
            View NFT onchain
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
